const Banner = require("../model/Banner")
const Trade = require("../model/Trade")
const { uploadToCloudinary, deleteFromCloudinary } = require("../service/uploadImage")


exports.getAllBanner = async (req, res) => {
    const id = req.params?.id
    try {
        if (id) {
            const result = await Banner.findById(id).populate("trad")
            if (result) {
                return res.status(200).json({ success: true, result })
            }
            return res.status(404).json({ success: false, msg: "No banner found" });
        }
        const result = await Banner.find().sort({ createdAt: -1 }).populate("trad")
        if (!result) {
            return res.status(404).json({ success: false, msg: "No banner found" });
        }
        return res.status(200).json({ success: true, result })
    } catch (error) {
        console.log("error on getAllBanner: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}

exports.paginationBanner = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query; // Default page = 1, limit = 10
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;
        const result = await Banner.find().skip(skip).limit(limit)
        const totalRecords = await Banner.countDocuments();
        const totalPages = Math.ceil(totalRecords / limit);
        if (result) {
            return res.status(200).json({ success: true, result, currentPage: page, totalPages, totalRecords });
        }
        return res.status(404).json({ success: false, msg: "No banner found" });
    } catch (error) {
        console.log("error on paginationBanner: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}

exports.addBanner = async (req, res) => {
    // console.log("req.body: ", req.body);
    // console.log("req.files: ", req.files);

    const name = req.body?.name
    const mobile = req.body?.mobile
    const email = req.body?.email
    const city = req.body?.city
    const state = req.body?.state
    const country = req.body?.country
    const trad = req.body?.trade
    const image = req.files.image
    try {
        /* const checkTrad = await Trade.findById(trad)
        if (!checkTrad) {
            return res.status(400).json({ error: "Trade not found!", success: false, msg: "Trade not found!" })
        } */

        const banner = new Banner({ name, mobile, email, city, state, country, trad })
        if (image) {
            let imageUrl = await uploadToCloudinary(image.tempFilePath)
            banner.image = imageUrl
        }
        const result = await banner.save()
        if (result) {
            return res.status(200).json({ success: true, msg: "Banner added successfully", result })
        }
        return res.status(400).json({ success: false, msg: "Failed to add banner!" })
    } catch (error) {
        console.log("error on addBanner: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}

exports.updateBanner = async (req, res) => {
    const id = req.params?.id

    const name = req.body?.name
    const mobile = req.body?.mobile
    const email = req.body?.email
    const city = req.body?.city
    const state = req.body?.state
    const country = req.body?.country
    const trad = req.body?.trade
    const image = req.files?.image


    try {
        const checkBanner = await Banner.findById(id)
        if (!checkBanner) {
            return res.status(400).json({ error: "Banner not found!", success: false, msg: "Banner not found!" })
        }
        if (name) checkBanner.name = name
        if (mobile) checkBanner.mobile = mobile
        if (email) checkBanner.email = email
        if (city) checkBanner.city = city
        if (state) checkBanner.state = state
        if (country) checkBanner.country = country
        // if (trad) checkBanner.trad = trad
        if (trad) {
            /* const checkTrad = await Trade.findById(trad)
            if (!checkTrad) {
                return res.status(400).json({ error: "Trade not found!", success: false, msg: "Trade not found!" })
            } */
            checkBanner.trad = trad
        }
        if (image) {
            if (checkBanner.image) {
                await deleteFromCloudinary(checkBanner?.image)
            }
            let imageUrl = await uploadToCloudinary(image.tempFilePath)
            checkBanner.image = imageUrl
        }

        const result = await checkBanner.save()
        if (result) {
            return res.status(200).json({ success: true, msg: "Banner updated successfully", result })
        }
        return res.status(400).json({ success: false, msg: "Failed to update banner!" })
    } catch (error) {
        console.log("error on updateTrade: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}


exports.deleteBanner = async (req, res) => {
    const id = req.params?.id
    try {
        const checkBanner = await Banner.findById(id)
        if (!checkBanner) {
            return res.status(400).json({ error: "Banner not found!", success: false, msg: "Banner not found!" })
        }
        if (checkBanner.image) {
            await deleteFromCloudinary(checkBanner?.image)
        }
        const result = await Banner.findByIdAndDelete(id)
        if (result) {
            return res.status(200).json({ success: true, msg: "Banner deleted successfully", result })
        }
        return res.status(400).json({ success: false, msg: "Failed to delete banner!" })
    } catch (error) {
        console.log("error on deleteBanner: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}