const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const { isCloudinaryConfigured } = require('../config/cloudinary');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const { convertAmount } = require('../utils/exchangeRate');

const checkBudgetLimit = async (userId, targetDate) => {
  const date = new Date(targetDate);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // Find budget for this month
  let budget = await Budget.findOne({ userId, year, month });
  let activeLimit = 0;

  if (budget) {
    activeLimit = budget.amount;
  } else {
    // Carry over logic
    const latestBudget = await Budget.findOne({ userId }).sort({ year: -1, month: -1 });
    if (latestBudget) {
      activeLimit = latestBudget.amount;
    }
  }

  if (activeLimit <= 0) {
    return { isOverBudget: false, isNearLimit: false, activeLimit: 0, totalSpent: 0 };
  }

  // Get total expenses for this month
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const expenses = await Expense.find({
    userId,
    date: { $gte: startOfMonth, $lte: endOfMonth }
  });

  const totalSpent = expenses.reduce((sum, e) => sum + (e.baseAmount !== undefined ? e.baseAmount : e.amount), 0);
  const isOverBudget = totalSpent > activeLimit;
  const isNearLimit = totalSpent >= (activeLimit * 0.8) && totalSpent <= activeLimit;

  return { isOverBudget, isNearLimit, activeLimit, totalSpent };
};

// GET /api/expenses
const getExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      startDate,
      endDate,
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const filter = { userId: req.userId };
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate('category', 'name icon color')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Expense.countDocuments(filter)
    ]);

    // Summary stats
    const allExpenses = await Expense.find({ userId: req.userId });
    const totalAmount = allExpenses.reduce((sum, e) => sum + (e.baseAmount !== undefined ? e.baseAmount : e.amount), 0);

    res.json({
      expenses,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      summary: {
        totalAmount,
        totalCount: total
      }
    });
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/expenses/:id
const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.userId })
      .populate('category', 'name icon color');
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });
    res.json({ expense });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/expenses
const createExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, category, amount, date, note, currency } = req.body;

    const userBaseCurrency = (req.user?.baseCurrency || 'MMK').toUpperCase();
    const expenseCurrency = (currency || 'MMK').toUpperCase();
    const { exchangeRateUsed, baseAmount } = await convertAmount(parseFloat(amount), expenseCurrency, userBaseCurrency);

    const expenseData = {
      userId: req.userId,
      name,
      category,
      amount: parseFloat(amount),
      currency: expenseCurrency,
      exchangeRateUsed,
      baseAmount,
      date: date || new Date(),
      note
    };

    if (req.file) {
      if (isCloudinaryConfigured) {
        try {
          const cloudinaryResult = await uploadToCloudinary(req.file.path, 'expense-tracker');
          expenseData.receipt = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            url: cloudinaryResult.url,
            publicId: cloudinaryResult.publicId,
            resourceType: cloudinaryResult.resourceType
          };
        } catch (uploadErr) {
          console.error('Failed to upload to Cloudinary, falling back to local storage:', uploadErr);
          expenseData.receipt = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            url: `/uploads/${req.file.filename}`
          };
        }
      } else {
        expenseData.receipt = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: `/uploads/${req.file.filename}`
        };
      }
    }

    const expense = await Expense.create(expenseData);
    await expense.populate('category', 'name icon color');

    const budgetStatus = await checkBudgetLimit(req.userId, expense.date);

    res.status(201).json({
      message: 'Expense added!',
      expense,
      ...budgetStatus
    });
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.userId });
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });

    const { name, category, amount, date, note, currency } = req.body;

    const updatedAmount = amount !== undefined ? parseFloat(amount) : expense.amount;
    const updatedCurrency = (currency || expense.currency || 'MMK').toUpperCase();
    const userBaseCurrency = (req.user?.baseCurrency || 'MMK').toUpperCase();

    const { exchangeRateUsed, baseAmount } = await convertAmount(updatedAmount, updatedCurrency, userBaseCurrency);

    Object.assign(expense, {
      name: name || expense.name,
      category: category || expense.category,
      amount: updatedAmount,
      currency: updatedCurrency,
      exchangeRateUsed,
      baseAmount,
      date: date || expense.date,
      note: note !== undefined ? note : expense.note
    });

    if (req.file) {
      // Remove old receipt file if exists
      if (expense.receipt?.publicId) {
        await deleteFromCloudinary(expense.receipt.publicId, expense.receipt.resourceType);
      } else if (expense.receipt?.filename) {
        const oldPath = path.join(__dirname, '../../uploads', expense.receipt.filename);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      if (isCloudinaryConfigured) {
        try {
          const cloudinaryResult = await uploadToCloudinary(req.file.path, 'expense-tracker');
          expense.receipt = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            url: cloudinaryResult.url,
            publicId: cloudinaryResult.publicId,
            resourceType: cloudinaryResult.resourceType
          };
        } catch (uploadErr) {
          console.error('Failed to upload to Cloudinary on update, falling back to local:', uploadErr);
          expense.receipt = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            url: `/uploads/${req.file.filename}`
          };
        }
      } else {
        expense.receipt = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: `/uploads/${req.file.filename}`
        };
      }
    }

    await expense.save();
    await expense.populate('category', 'name icon color');

    const budgetStatus = await checkBudgetLimit(req.userId, expense.date);

    res.json({
      message: 'Expense updated!',
      expense,
      ...budgetStatus
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.userId });
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });

    // Remove receipt file
    if (expense.receipt?.publicId) {
      await deleteFromCloudinary(expense.receipt.publicId, expense.receipt.resourceType);
    } else if (expense.receipt?.filename) {
      const filePath = path.join(__dirname, '../../uploads', expense.receipt.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await expense.deleteOne();
    res.json({ message: 'Expense deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/expenses/stats/summary
const getStats = async (req, res) => {
  try {
    const { year, month } = req.query;
    const now = new Date();
    const y = parseInt(year) || now.getFullYear();
    const m = parseInt(month) || now.getMonth() + 1;

    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59);

    const byCategory = await Expense.aggregate([
      { $match: { userId: req.userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$category', total: { $sum: { $ifNull: ['$baseAmount', '$amount'] } }, count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { name: '$category.name', icon: '$category.icon', color: '$category.color', total: 1, count: 1 } },
      { $sort: { total: -1 } }
    ]);

    const monthlyTotal = byCategory.reduce((sum, c) => sum + c.total, 0);

    // Last 6 months trend
    const trend = await Expense.aggregate([
      {
        $match: {
          userId: req.userId,
          date: { $gte: new Date(y, m - 7, 1), $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: { $ifNull: ['$baseAmount', '$amount'] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({ byCategory, monthlyTotal, trend });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getExpenses, getExpense, createExpense, updateExpense, deleteExpense, getStats };
