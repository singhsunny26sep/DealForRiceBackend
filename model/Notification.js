const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        // required: true
    },
    message: {
        type: String,
        // required: true
    },
    seen: {
        type: Boolean,
        default: false
    },
    targetType: {
        type: String,
        enum: ['User', 'Product', 'Trade', 'Subscription', 'Message', 'Notification'],
        // required: true
        default: 'Notification'
    },
    action: {
        type: String,
        enum: ['like', 'comment', 'reply', 'follow', 'subscribe', 'unsubscribe', 'purchase', 'sell', 'trade', 'subscription', 'message', 'notification', 'added'],
        // required: true
        default: 'notification'
    },
    data: {
        type: mongoose.Schema.Types.Mixed
    }
}, { timestamps: true })

const Notification = mongoose.model('Notification', NotificationSchema)
module.exports = Notification