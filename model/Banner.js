const mongoose = require('mongoose')

const BannerSchema = new mongoose.Schema({
    mobile: {
        type: Number
    },
    email: {
        type: String
    },
    name: {
        type: String
    },
    image: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String,
    },
    country: {
        type: String
    },
    trad: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trade'
    }
}, { timestamps: true })

const Banner = mongoose.model('Banner', BannerSchema)
module.exports = Banner