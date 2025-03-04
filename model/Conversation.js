const mongoose = require('mongoose');

const conversation = new mongoose.Schema({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    isGroup: {
        type: Boolean,
        default: false
    },
    messages: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
            default: []
        }
    ],
    unreadCounts: {
        type: Map,
        of: Number, // Key: userId, Value: unread message count
        default: {}
    }
}, { timestamps: true });

const Conversation = mongoose.model('conversation', conversation);
module.exports = Conversation;