const mongoose = require('mongoose')

const MediaSchema = new mongoose.Schema({
    url: {
        type: String
    },
    type: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat'
    }
}, { timestamps: true })
const Media = mongoose.model('Media', MediaSchema)
module.exports = Media