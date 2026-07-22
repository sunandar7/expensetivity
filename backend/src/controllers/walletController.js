const { validationResult } = require('express-validator');
const Wallet = require('../models/Wallet');

// GET /api/wallets — get all wallets for the authenticated user
const getWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ wallets });
  } catch (err) {
    console.error('Get wallets error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/wallets/:id — get a single wallet by ID
const getWalletById = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ _id: req.params.id, userId: req.userId });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found.' });
    }
    res.json({ wallet });
  } catch (err) {
    console.error('Get wallet error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid wallet ID.' });
    }
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/wallets — create a new wallet
const createWallet = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, currency, balance } = req.body;

    // Check for duplicate wallet name for the same user
    const existing = await Wallet.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      userId: req.userId
    });

    if (existing) {
      return res.status(409).json({ message: 'A wallet with this name already exists.' });
    }

    const wallet = await Wallet.create({
      userId: req.userId,
      name: name.trim(),
      currency: currency.trim().toUpperCase(),
      balance: balance !== undefined ? parseFloat(balance) : 0
    });

    res.status(201).json({ message: 'Wallet created successfully!', wallet });
  } catch (err) {
    console.error('Create wallet error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/wallets/:id — update a wallet
const updateWallet = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const wallet = await Wallet.findOne({ _id: req.params.id, userId: req.userId });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found or not authorized.' });
    }

    const { name, currency, balance } = req.body;

    if (name && name.trim().toLowerCase() !== wallet.name.toLowerCase()) {
      const existing = await Wallet.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        userId: req.userId,
        _id: { $ne: wallet._id }
      });
      if (existing) {
        return res.status(409).json({ message: 'A wallet with this name already exists.' });
      }
      wallet.name = name.trim();
    }

    if (currency) {
      wallet.currency = currency.trim().toUpperCase();
    }

    if (balance !== undefined && !isNaN(parseFloat(balance))) {
      wallet.balance = parseFloat(balance);
    }

    await wallet.save();

    res.json({ message: 'Wallet updated successfully!', wallet });
  } catch (err) {
    console.error('Update wallet error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid wallet ID.' });
    }
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/wallets/:id — delete a wallet
const deleteWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ _id: req.params.id, userId: req.userId });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found or not authorized.' });
    }

    await wallet.deleteOne();
    res.json({ message: 'Wallet deleted successfully.' });
  } catch (err) {
    console.error('Delete wallet error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid wallet ID.' });
    }
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getWallets,
  getWalletById,
  createWallet,
  updateWallet,
  deleteWallet
};
