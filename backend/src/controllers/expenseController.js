const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Wallet = require('../models/Wallet');
const { isCloudinaryConfigured } = require('../config/cloudinary');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const { convertAmount } = require('../utils/exchangeRate');
const { withTransaction } = require('../utils/transaction');

const getWalletDeductAmount = async (expenseAmount, expenseCurrency, walletCurrency) => {
  const normExp = (expenseCurrency || 'MMK').toUpperCase();
  const normWallet = (walletCurrency || 'MMK').toUpperCase();

  if (normExp === normWallet) {
    return expenseAmount;
  }
  const { baseAmount } = await convertAmount(expenseAmount, normExp, normWallet);
  return baseAmount;
};

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

    const { name, category, amount, date, note, currency, walletId } = req.body;
    const numAmount = parseFloat(amount);
    const userBaseCurrency = (req.user?.baseCurrency || 'MMK').toUpperCase();
    const expenseCurrency = (currency || userBaseCurrency).toUpperCase();

    const { exchangeRateUsed, baseAmount } = await convertAmount(numAmount, expenseCurrency, userBaseCurrency);

    const expenseData = {
      userId: req.userId,
      name,
      category,
      amount: numAmount,
      currency: expenseCurrency,
      exchangeRateUsed,
      baseAmount,
      date: date || new Date(),
      note,
      walletId: walletId || null
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

    let createdExpense;
    await withTransaction(async (session) => {
      const opts = session ? { session } : {};

      // If wallet is selected, check balance and deduct
      if (walletId) {
        const wallet = await Wallet.findOne({ _id: walletId, userId: req.userId }, null, opts);
        if (!wallet) {
          const err = new Error('Selected wallet not found or unauthorized.');
          err.statusCode = 404;
          throw err;
        }

        const walletDeductAmount = await getWalletDeductAmount(numAmount, expenseCurrency, wallet.currency);

        if (wallet.balance < walletDeductAmount) {
          const err = new Error(`Insufficient wallet balance in "${wallet.name}". Required: ${new Intl.NumberFormat().format(walletDeductAmount)} ${wallet.currency}, Available: ${new Intl.NumberFormat().format(wallet.balance)} ${wallet.currency}`);
          err.statusCode = 400;
          throw err;
        }

        wallet.balance = Math.round((wallet.balance - walletDeductAmount) * 100) / 100;
        await wallet.save(opts);
      }

      const expense = new Expense(expenseData);
      await expense.save(opts);
      createdExpense = expense;
    });

    await createdExpense.populate('category', 'name icon color');

    const budgetStatus = await checkBudgetLimit(req.userId, createdExpense.date);

    res.status(201).json({
      message: 'Expense added!',
      expense: createdExpense,
      ...budgetStatus
    });
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error.' });
  }
};

// PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const { name, category, amount, date, note, currency, walletId } = req.body;
    let updatedExpense;

    await withTransaction(async (session) => {
      const opts = session ? { session } : {};

      const expense = await Expense.findOne({ _id: req.params.id, userId: req.userId }, null, opts);
      if (!expense) {
        const err = new Error('Expense not found.');
        err.statusCode = 404;
        throw err;
      }

      const oldWalletId = expense.walletId;
      const oldAmount = expense.amount;
      const oldCurrency = expense.currency;

      const newAmount = amount !== undefined ? parseFloat(amount) : expense.amount;
      const newCurrency = (currency || expense.currency || 'MMK').toUpperCase();
      const newWalletId = walletId !== undefined ? (walletId || null) : expense.walletId;

      const userBaseCurrency = (req.user?.baseCurrency || 'MMK').toUpperCase();
      const { exchangeRateUsed, baseAmount } = await convertAmount(newAmount, newCurrency, userBaseCurrency);

      // Revert old wallet balance if previously attached
      if (oldWalletId) {
        const oldWallet = await Wallet.findOne({ _id: oldWalletId, userId: req.userId }, null, opts);
        if (oldWallet) {
          const oldDeduct = await getWalletDeductAmount(oldAmount, oldCurrency, oldWallet.currency);
          oldWallet.balance = Math.round((oldWallet.balance + oldDeduct) * 100) / 100;
          await oldWallet.save(opts);
        }
      }

      // Deduct from new wallet if attached
      if (newWalletId) {
        const newWallet = await Wallet.findOne({ _id: newWalletId, userId: req.userId }, null, opts);
        if (!newWallet) {
          const err = new Error('Selected wallet not found or unauthorized.');
          err.statusCode = 404;
          throw err;
        }

        const newDeduct = await getWalletDeductAmount(newAmount, newCurrency, newWallet.currency);

        if (newWallet.balance < newDeduct) {
          const err = new Error(`Insufficient wallet balance in "${newWallet.name}". Required: ${new Intl.NumberFormat().format(newDeduct)} ${newWallet.currency}, Available: ${new Intl.NumberFormat().format(newWallet.balance)} ${newWallet.currency}`);
          err.statusCode = 400;
          throw err;
        }

        newWallet.balance = Math.round((newWallet.balance - newDeduct) * 100) / 100;
        await newWallet.save(opts);
      }

      Object.assign(expense, {
        name: name || expense.name,
        category: category || expense.category,
        amount: newAmount,
        currency: newCurrency,
        exchangeRateUsed,
        baseAmount,
        date: date || expense.date,
        note: note !== undefined ? note : expense.note,
        walletId: newWalletId
      });

      if (req.file) {
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

      await expense.save(opts);
      updatedExpense = expense;
    });

    await updatedExpense.populate('category', 'name icon color');

    const budgetStatus = await checkBudgetLimit(req.userId, updatedExpense.date);

    res.json({
      message: 'Expense updated!',
      expense: updatedExpense,
      ...budgetStatus
    });
  } catch (err) {
    console.error('Update expense error:', err);
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error.' });
  }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    await withTransaction(async (session) => {
      const opts = session ? { session } : {};

      const expense = await Expense.findOne({ _id: req.params.id, userId: req.userId }, null, opts);
      if (!expense) {
        const err = new Error('Expense not found.');
        err.statusCode = 404;
        throw err;
      }

      // Restore wallet balance if wallet was attached
      if (expense.walletId) {
        const wallet = await Wallet.findOne({ _id: expense.walletId, userId: req.userId }, null, opts);
        if (wallet) {
          const refundAmount = await getWalletDeductAmount(expense.amount, expense.currency, wallet.currency);
          wallet.balance = Math.round((wallet.balance + refundAmount) * 100) / 100;
          await wallet.save(opts);
        }
      }

      // Remove receipt file
      if (expense.receipt?.publicId) {
        await deleteFromCloudinary(expense.receipt.publicId, expense.receipt.resourceType);
      } else if (expense.receipt?.filename) {
        const filePath = path.join(__dirname, '../../uploads', expense.receipt.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      await expense.deleteOne(opts);
    });

    res.json({ message: 'Expense deleted.' });
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error.' });
  }
};

// GET /api/expenses/convert
const convertCurrencyRate = async (req, res) => {
  try {
    const { amount, from, to } = req.query;
    if (!amount || !from || !to) {
      return res.status(400).json({ message: 'Missing parameters: amount, from, and to are required.' });
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return res.status(400).json({ message: 'Invalid amount parameter.' });
    }
    const { exchangeRateUsed, baseAmount } = await convertAmount(numAmount, from.toUpperCase(), to.toUpperCase());
    res.json({
      amount: numAmount,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      exchangeRateUsed,
      convertedAmount: baseAmount
    });
  } catch (err) {
    console.error('Convert currency error:', err);
    res.status(500).json({ message: 'Currency conversion failed.' });
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

module.exports = { getExpenses, getExpense, createExpense, updateExpense, deleteExpense, getStats, convertCurrencyRate };
