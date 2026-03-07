const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const categoryRoutes = require('./routes/categories');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Expense Tracker API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expense_tracker')
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    // Seed default categories
    const Category = require('./models/Category');
    const defaultCategories = [
      { name: 'Food & Dining', icon: '🍜', color: '#FF6B6B', isDefault: true },
      { name: 'Saving', icon: '💰', color: '#4ECDC4', isDefault: true },
      { name: 'Cosmetic', icon: '💄', color: '#FF8FB1', isDefault: true },
      { name: 'Transport', icon: '🚗', color: '#95D2B3', isDefault: true },
      { name: 'Shopping', icon: '🛍️', color: '#F7DC6F', isDefault: true },
      { name: 'Healthcare', icon: '💊', color: '#82E0AA', isDefault: true },
      { name: 'Entertainment', icon: '🎬', color: '#BB8FCE', isDefault: true },
      { name: 'Bills & Utilities', icon: '📱', color: '#85C1E9', isDefault: true },
      { name: 'Education', icon: '📚', color: '#F0B27A', isDefault: true },
      { name: 'Other', icon: '📌', color: '#AAB7B8', isDefault: true },
    ];

    for (const cat of defaultCategories) {
      await Category.findOneAndUpdate(
        { name: cat.name, isDefault: true },
        cat,
        { upsert: true, new: true }
      );
    }
    console.log('✅ Default categories seeded');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
