const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const Expense = require('../models/Expense');

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
    const totalAmount = allExpenses.reduce((sum, e) => sum + e.amount, 0);

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

    const { name, category, amount, date, note } = req.body;

    const expenseData = {
      userId: req.userId,
      name,
      category,
      amount: parseFloat(amount),
      date: date || new Date(),
      note
    };

    if (req.file) {
      expenseData.receipt = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`
      };
    }

    const expense = await Expense.create(expenseData);
    await expense.populate('category', 'name icon color');

    res.status(201).json({ message: 'Expense added!', expense });
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

    const { name, category, amount, date, note } = req.body;
    Object.assign(expense, {
      name: name || expense.name,
      category: category || expense.category,
      amount: amount !== undefined ? parseFloat(amount) : expense.amount,
      date: date || expense.date,
      note: note !== undefined ? note : expense.note
    });

    if (req.file) {
      // Remove old receipt file if exists
      if (expense.receipt?.filename) {
        const oldPath = path.join(__dirname, '../../uploads', expense.receipt.filename);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      expense.receipt = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`
      };
    }

    await expense.save();
    await expense.populate('category', 'name icon color');

    res.json({ message: 'Expense updated!', expense });
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
    if (expense.receipt?.filename) {
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
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
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
          total: { $sum: '$amount' },
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
