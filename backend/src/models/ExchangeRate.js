const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
  base: {
    type: String,
    required: true,
    default: 'USD'
  },
  rates: {
    type: Map,
    of: Number,
    required: true
  },
  fetchedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);
