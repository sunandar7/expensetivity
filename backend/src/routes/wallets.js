const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getWallets,
  getWalletById,
  createWallet,
  updateWallet,
  deleteWallet
} = require('../controllers/walletController');
const auth = require('../middleware/auth');

// All wallet routes require authentication
router.use(auth);

// GET /api/wallets — get all user wallets
router.get('/', getWallets);

// GET /api/wallets/:id — get single wallet
router.get('/:id', getWalletById);

// POST /api/wallets — create a wallet
router.post('/', [
  body('name')
    .trim()
    .notEmpty().withMessage('Wallet name is required')
    .isLength({ max: 100 }).withMessage('Wallet name cannot exceed 100 characters'),
  body('currency')
    .trim()
    .notEmpty().withMessage('Currency is required'),
  body('balance')
    .optional()
    .isFloat({ min: 0 }).withMessage('Balance must be a non-negative number')
], createWallet);

// PUT /api/wallets/:id — update a wallet
router.put('/:id', [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Wallet name cannot be empty')
    .isLength({ max: 100 }).withMessage('Wallet name cannot exceed 100 characters'),
  body('currency')
    .optional()
    .trim()
    .notEmpty().withMessage('Currency cannot be empty'),
  body('balance')
    .optional()
    .isFloat({ min: 0 }).withMessage('Balance must be a non-negative number')
], updateWallet);

// DELETE /api/wallets/:id — delete a wallet
router.delete('/:id', deleteWallet);

module.exports = router;
