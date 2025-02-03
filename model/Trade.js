const mongoose = require('mongoose')

const TradeSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    description: {
        type: String
    },
    tradeType: {
        type: String
    }
}, { timestamps: true })


const Trade = mongoose.model('Trade', TradeSchema)
module.exports = Trade