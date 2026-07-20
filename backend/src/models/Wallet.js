const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Wallet name is required'],
        trim: true,
        maxlength: [100, 'Wallet name cannot exceed 100 characters']
    },
    currency: {
        type: String,
        required: [true, 'Currency is required']
    },
    balance: {
        type: Number,
        required: [true, 'Balance is required'],
        min: [0, 'Balance cannot be negative'],
        default: 0
    }
}, { timestamps: true });

// Indexing for wallet
walletSchema.index({ userId: 1, currency: 1 });

module.exports = mongoose.model('Wallet', walletSchema);
