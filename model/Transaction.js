const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        // required: true
    },
    quantity: {
        type: Number,
        // required: true,
        default: 1
    },
    price: {
        type: Number,
        // required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    address: {
        type: String,
    },
    orderId: {
        type: String
    },
}, { timestamps: true })

const Transaction = mongoose.model('Transaction', TransactionSchema)
module.exports = Transaction;