const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        // unique: true,
        // match: /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/
    },
    mobile: {
        type: String,
        required: true,
        // unique: true,
        // match: /^\+?\d{1,10}$/
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        /* validate: {
            validator: function (value) {
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{5,}$/.test(value);
            },
            message: 'Password should contain at least 5 characters, including uppercase and lowercase letters, numbers, and special characters'
        } */
    },
    trade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trade',
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin', 'manager']
    },
    address: {
        type: String,
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    image: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: false
    },
    isSubscribed: {
        type: Boolean,
        default: false
    },
    subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscribeHistory'
    },
    fcmToken: {
        type: String,
    },
    lastMessage: String,
    lastMessageTime: Date,
    unreadCount: { type: Number, default: 0 }
}, { timestamps: true })
const User = mongoose.model('User', UserSchema);

module.exports = User;