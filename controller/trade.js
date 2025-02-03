const Trade = require("../model/Trade");
const mongoose = require('mongoose');

exports.getTrade = async (req, res) => {
    const id = req.params?.id
    try {
        if (id) {
            const trade = await Trade.findById(id);
            if (trade) {
                return res.status(200).json({ success: true, msg: "Trade found", result: trade });
            }
            return res.status(404).json({ success: false, msg: "Trade not found" });
        }
        const result = await Trade.find()
        if (!result) {
            return res.status(404).json({ success: false, msg: "No trades found" });
        }
        return res.status(200).json({ success: true, msg: "All trades found", result });
    } catch (error) {
        console.error("Error in getTrade: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}


exports.addOrUpdateTrade = async (req, res) => {
    const name = req.body?.name
    const id = req.params?.id

    try {
        const result = await Trade.findOneAndUpdate(
            { _id: id || new mongoose.Types.ObjectId() }, // If tradeId exists, update; else, create new
            { name },
            { new: true, upsert: true } // `upsert: true` creates new if not exists
        );

        return res.status(200).json({ success: true, msg: id ? `Trade ${name} updated successfully` : `Trade ${name} added successfully`, result });

    } catch (error) {
        console.error("Error in addOrUpdateTrade: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
};


exports.deleteTrade = async (req, res) => {
    const id = req.params?.id
    try {
        if (id) {
            const trade = await Trade.findByIdAndDelete(id);
            if (trade) {
                return res.status(200).json({ success: true, msg: `Trade ${trade?.name} deleted successfully` });
            }
            return res.status(404).json({ success: false, msg: "Trade not found" });
        }
        return res.status(400).json({ success: false, msg: "Invalid trade ID" });
    } catch (error) {
        console.error("Error in deleteTrade: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}