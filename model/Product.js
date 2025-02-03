const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
    },
    image: {
        type: String,
    },
    trade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trade',
    },
    /* category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    }, */
    /* brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
    }, */
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true })

const Product = mongoose.model('Product', ProductSchema)
module.exports = Product