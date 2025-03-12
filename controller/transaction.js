const Product = require("../model/Product")
const Transaction = require("../model/Transaction")
const User = require("../model/User")


exports.getAll = async (req, res) => {
    try {
        const result = await Transaction.find().sort({ createdAt: -1 }).populate("buyerId", "name email mobile image").populate("sellerId", "name email mobile image")
        if (result) {
            return res.status(200).json({ success: true, result });
        }
        return res.status(404).json({ success: false, msg: "No transactions found" });
    } catch (error) {
        console.error("Error in getAll: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}

exports.createTransaction = async (req, res) => {
    const id = req.params?.id
    const userId = req.payload?._id
    // const sellerId = req.body?.sellerId
    const address = req.body?.address
    const price = req.body?.price

    try {
        const checkSeller = await User.findById(sellerId)
        if (!checkSeller) {
            return res.status(404).json({ success: false, msg: "Seller not found!" });
        }
        const checkProduct = await Product.findById(id)
        if (!checkProduct) {
            return res.status(404).json({ success: false, msg: "Product not found!" });
        }
        const result = Transaction.create({ buyerId: userId, sellerId: checkProduct?.user, productId: id, status: "completed", address, price })
        if (result) {
            return res.status(201).json({ success: true, msg: "Transaction created successfully!" });
        }
        return res.status(400).json({ success: false, msg: "Transaction failed!" });
    } catch (error) {
        console.error("Error in createTransaction: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}


exports.getTransactions = async (req, res) => {
    const userId = req.payload?._id
    try {
        const transactions = await Transaction.find({ buyerId: userId }).populate("sellerId", "name mobile email address city image").populate("productId", "name price image description").exec()
        if (transactions) {
            return res.status(200).json({ success: true, data: transactions });
        }
        return res.status(404).json({ success: false, msg: "No transactions found for this user!" });
    } catch (error) {
        console.error("Error in getTransactions: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}

exports.getSingleTransaction = async (req, res) => {
    const id = req.params?.id
    try {
        const transaction = await Transaction.findById(id).populate("sellerId", "name mobile email address city image").populate("productId", "name price image description").exec()
        if (transaction) {
            return res.status(200).json({ success: true, data: transaction });
        }
        return res.status(404).json({ success: false, msg: "Transaction not found!" });
    } catch (error) {
        console.error("Error in getSingleTransaction: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}