const { generateToken } = require("../middleware/authValidation");
const User = require("../model/User")
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { deleteFromCloudinary, uploadToCloudinary } = require("../service/uploadImage");
let salt = 10;

exports.userProfile = async (req, res) => {
    const id = req.params?.id || req.payload?._id
    try {
        if (!id) {
            return res.status(400).json({ error: "User not found", success: false, msg: "User not found" })
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid trade ID", success: false, msg: "Invalid trade ID" });
        }
        const user = await User.findById(id).populate("trade")
        if (!user) {
            return res.status(404).json({ error: "User not found", success: false, msg: "User not found" })
        }
        return res.status(200).json({ success: true, result: user })
    } catch (error) {
        console.log("error on userProfile: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}

exports.registorUser = async (req, res) => {

    const name = req.body?.name
    const email = req.body?.email
    const mobile = req.body?.mobile
    const password = req.body?.password
    const trade = req.body?.trade
    const city = req.body?.city
    const state = req.body?.state
    const image = req.files?.image

    try {
        const checkUser = await User.findOne({ email })
        if (checkUser) {
            return res.status(400).json({ error: "Email already exists", success: false, msg: "Email already exists" })
        }
        const hashedPass = await bcrypt.hash(password, parseInt(salt));
        if (!hashedPass) {
            return res.status(400).json({ success: false, msg: "Failed to register!" });
        }

        /* if (role) {
            if (role === "admin") {
                return res.status(400).json({ success: false, msg: "Admin role is not allowed" });
            }
        } */

        const user = new User({ name, email, mobile, password: hashedPass })
        if (mongoose.Types.ObjectId.isValid(trade)) {
            user.trade = trade
        }
        if (city) user.city = city
        if (state) user.state = state

        if (image) {
            let imageUrl = await uploadToCloudinary(image.tempFilePath)
            user.image = imageUrl
        }
        const result = await user.save()
        if (result) {
            const token = await generateToken(result)
            return res.status(200).json({ success: true, msg: `User registered successfully`, result, token })
        }
        return res.status(400).json({ error: "Failed to register user", success: false, msg: "Failed to register user" })
    } catch (error) {
        console.log("error on registorUser: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}


exports.loginUser = async (req, res) => {
    const email = req.body?.email
    const password = req.body?.password
    try {
        const checkUser = await User.findOne({ email: email })
        if (!checkUser) {
            return res.status(401).json({ error: "Invalid credentials", success: false, msg: "User not found" })
        }
        const matchedPass = await bcrypt.compare(password, checkUser.password);
        if (!matchedPass) {
            return res.status(401).json({ success: false, msg: "Invalid credentials" })
        }
        const token = await generateToken(checkUser)
        return res.status(200).json({ success: true, msg: "User logged in successfully", token })
    } catch (error) {
        console.log("error on loginUser: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}

exports.uploadProfileImage = async (req, res) => {
    const id = req.payload._id //user id
    const image = req.files?.image
    

    try {
        const checkUser = await User.findById(id)
        if (!checkUser) {
            return res.status(400).json({ success: false, msg: 'User not found!' })
        }
        if (checkUser.image) {
            await deleteFromCloudinary(checkUser?.image)
        }
        let imageUrl = await uploadToCloudinary(image.tempFilePath)

        checkUser.image = imageUrl
        const result = await checkUser.save()
        if (result) {
            return res.status(200).json({ success: true, msg: 'Profile image updated successfully', data: result })
        }
        return res.status(400).json({ success: false, msg: 'Failed to update profile image!' })
    } catch (error) {
        console.log("error on uploadProfileImage: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}

exports.userUpdate = async (req, res) => {

    const id = req.payload._id //user id
    const name = req.body?.name
    const email = req.body?.email
    const mobile = req.body?.mobile
    const address = req.body?.address
    const trade = req.body?.trade
    const city = req.body?.city
    const state = req.body?.state
    try {
        const checkUser = await User.findById(id)
        if (!checkUser) {
            return res.status(400).json({ success: false, msg: 'User not found!' })
        }
        if (name) checkUser.name = name
        if (email) checkUser.email = email
        if (mobile) checkUser.mobile = mobile
        if (address) checkUser.address = address
        if (trade) checkUser.trade = trade
        if (city) checkUser.city = city
        if (state) checkUser.state = state

        const result = await checkUser.save()
        if (result) {
            return res.status(200).json({ success: true, msg: 'User updated successfully', data: result })
        }
        return res.status(400).json({ success: false, msg: 'Failed to update user!' })
    } catch (error) {
        console.log("error on userUpdate: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}