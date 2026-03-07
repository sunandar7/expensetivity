const { validationResult } = require('express-validator');
const Category = require('../models/Category');

// GET /api/categories — get all (default + user's own)
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      $or: [{ isDefault: true }, { userId: req.userId }]
    }).sort({ isDefault: -1, name: 1 });

    res.json({ categories });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/categories — create custom category
const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, icon, color } = req.body;

    // Check for duplicate
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      $or: [{ isDefault: true }, { userId: req.userId }]
    });

    if (existing) {
      return res.status(409).json({ message: 'A category with this name already exists.' });
    }

    const category = await Category.create({
      name,
      icon: icon || '📌',
      color: color || '#AAB7B8',
      userId: req.userId,
      isDefault: false
    });

    res.status(201).json({ message: 'Category created!', category });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/categories/:id — update user's category
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.userId });
    if (!category) {
      return res.status(404).json({ message: 'Category not found or not authorized.' });
    }

    const { name, icon, color } = req.body;
    Object.assign(category, { name, icon, color });
    await category.save();

    res.json({ message: 'Category updated!', category });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/categories/:id — delete user's category
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.userId });
    if (!category) {
      return res.status(404).json({ message: 'Category not found or not authorized.' });
    }

    await category.deleteOne();
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
