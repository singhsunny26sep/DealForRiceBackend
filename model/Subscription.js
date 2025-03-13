const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
    name: {
        type: String
    },
    amount: {
        type: Number
    },
    description: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    duration: {
        type: Number,
        default: 12  // months by default (1 year)
    },
    trade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trade'
    }
}, { timestamps: true })

const Subscription = mongoose.model('Subscription', SubscriptionSchema);
module.exports = Subscription;