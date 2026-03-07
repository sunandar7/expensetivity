const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getExpenses, getExpense, createExpense, updateExpense, deleteExpense, getStats
} = require('../controllers/expenseController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(auth);

router.get('/stats/summary', getStats);
router.get('/', getExpenses);
router.get('/:id', getExpense);

router.post('/', upload.single('receipt'), [
  body('name').trim().notEmpty().withMessage('Expense name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('date').optional().isISO8601().withMessage('Invalid date format')
], createExpense);

router.put('/:id', upload.single('receipt'), updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
