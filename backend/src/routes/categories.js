const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', getCategories);

router.post('/', [
  body('name').trim().notEmpty().withMessage('Category name is required')
    .isLength({ max: 50 }).withMessage('Category name too long'),
  body('color').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid color format')
], createCategory);

router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
