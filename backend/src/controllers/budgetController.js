const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

const getBudget = async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);
    const year = parseInt(req.query.year) || now.getFullYear();

    // Find budget for this month
    let budget = await Budget.findOne({ userId: req.userId, year, month });
    let activeLimit = 0;
    
    if (budget) {
      activeLimit = budget.amount;
    } else {
      // Auto reset/carry-over logic: look for the most recent budget set by the user
      const latestBudget = await Budget.findOne({ userId: req.userId }).sort({ year: -1, month: -1 });
      if (latestBudget) {
        activeLimit = latestBudget.amount;
      }
    }

    // Find expenses for this month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const expenses = await Expense.find({
      userId: req.userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = activeLimit - totalExpenses;
    const isOverBudget = activeLimit > 0 && totalExpenses > activeLimit;
    const isNearLimit = activeLimit > 0 && totalExpenses >= (activeLimit * 0.8) && totalExpenses <= activeLimit;

    res.json({
      budget,
      activeLimit,
      totalExpenses,
      remaining,
      isNearLimit,
      isOverBudget,
      month,
      year
    });
  } catch (err) {
    console.error('Get budget error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const setBudget = async (req, res) => {
  try {
    const { amount, month, year } = req.body;
    const now = new Date();
    const m = parseInt(month) || (now.getMonth() + 1);
    const y = parseInt(year) || now.getFullYear();

    if (amount === undefined || amount === null || isNaN(amount) || amount < 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId, year: y, month: m },
      { amount: parseFloat(amount) },
      { new: true, upsert: true }
    );

    res.json({ message: 'Budget set successfully!', budget });
  } catch (err) {
    console.error('Set budget error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getBudget, setBudget };
