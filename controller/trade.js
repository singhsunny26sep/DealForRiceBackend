const Trade = require("../model/Trade");
const mongoose = require('mongoose');
const { uploadToCloudinary, deleteFromCloudinary } = require("../service/uploadImage");

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

exports.getPaginationTrand = async (req, res) => {
    let { page, limit, search } = req.query;
    try {

        // Convert page and limit to numbers, set default values
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;

        const query = {};

        // If search query exists, filter results
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } }, // Case-insensitive search
                { tradeType: { $regex: search, $options: "i" } }
            ];
        }

        // Fetch total count for pagination
        const totalRecords = await Trade.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / limit);

        // Fetch paginated results
        const trades = await Trade.find(query).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }); // Sort by latest created

        return res.status(200).json({ success: true, trades, currentPage: page, totalPages, totalRecords });
    } catch (error) {
        console.error("Error in getPaginationTrand: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
};


exports.addOrUpdateTrade = async (req, res) => {
    const name = req.body?.name
    const id = req.params?.id
    const image = req.files?.image

    try {
        let result
        if (id) {
            result = await Trade.findById(id)
        } else {
            result = new Trade({ name })
        }

        if (id && name) result.name = name

        if (image) {
            if (result.image) {
                await deleteFromCloudinary(result?.image)
            }
            let imageUrl = await uploadToCloudinary(image.tempFilePath)
            result.image = imageUrl
        }

        await result.save()

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