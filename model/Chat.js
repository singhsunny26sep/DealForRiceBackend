const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    roomId: String,
    sender: mongoose.Schema.Types.ObjectId,
    receiver: mongoose.Schema.Types.ObjectId,
    message: String,
    seen: { type: Boolean, default: false },
    readBy: {
        type: Map,  // Store read status for both users
        of: Boolean,
        default: {} // Default empty object
    },
    media: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media'
    },
    image: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model("Chat", chatSchema);
