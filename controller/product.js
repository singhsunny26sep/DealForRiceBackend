const Product = require("../model/Product");
const User = require("../model/User");
const { uploadToCloudinary, deleteFromCloudinary } = require("../service/uploadImage")
const mongoose = require('mongoose');


exports.getAllProducts = async (req, res) => {
    const id = req.params?.id
    try {
        if (id) {
            const product = await Product.findById(id).populate({ path: "user", select: "-password -createdAt -updatedAt -__v -role" }).populate("trade")
            if (product) {
                return res.status(200).json({ success: true, msg: "Product found", result: product });
            }
            return res.status(404).json({ success: false, msg: "Product not found" });
        }
        const result = await Product.find().sort({ createdAt: -1 }).populate({ path: "user", select: "-password -createdAt -updatedAt -__v -role" }).populate("trade")
        if (!result) {
            return res.status(404).json({ success: false, msg: "No products found" });
        }
        return res.status(200).json({ success: true, msg: "All products found", result });
    } catch (error) {
        console.log("error on addProduct: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}

exports.getProductByUserId = async (req, res) => {
    const id = req.params?.id // user id

    try {
        const checkUser = await User.findById(id)

        if (!checkUser) {
            return res.status(400).json({ success: false, msg: 'User not found!' })
        }
        const result = await Product.find({ user: id }).populate({ path: "user", select: "-password" }).populate("trade")

        if (result) {
            return res.status(200).json({ success: true, msg: "Products found", result });
        }
        return res.status(404).json({ success: false, msg: "No products found" });
    } catch (error) {
        console.log("error on getProductByUserId: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}

exports.addProduct = async (req, res) => {
    const name = req.body?.name
    const description = req.body?.description
    const price = req.body?.price
    const image = req.files?.image
    const id = req.payload?._id //uesr id of created product
    const trade = req.body?.trade

    try {
        if (!name) {
            return res.status(400).json({ success: false, msg: 'Name is required!' })
        }
        if (!price) {
            return res.status(400).json({ success: false, msg: 'Price is required!' })
        }
        const product = new Product({ name, description, price, user: id })
        if (image) {
            let imageUrl = await uploadToCloudinary(image.tempFilePath)
            product.image = imageUrl
        }
        if (mongoose.Types.ObjectId.isValid(trade)) product.trade = trade

        const result = await product.save()
        if (result) {
            return res.status(200).json({ success: true, msg: 'Product added successfully', result })
        }
        return res.status(400).json({ success: false, msg: 'Failed to add product!' })
    } catch (error) {
        console.log("error on addProduct: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}

exports.updateProduct = async (req, res) => {
    const id = req.params?.id // product id
    const user = req.payload?._id // user id
    const name = req.body?.name
    const description = req.body?.description
    const price = req.body?.price
    const image = req.files?.image
    const trade = req.body?.trade
    try {
        const checkProduct = await Product.findOne({ _id: id, user: user })
        if (!checkProduct) {
            return res.status(404).json({ success: false, msg: 'Product not found!' })
        }
        if (name) checkProduct.name
        if (description) checkProduct.description
        if (price) checkProduct.price
        if (mongoose.Types.ObjectId.isValid(trade)) checkProduct.trade

        if (image) {
            if (checkProduct.image) {
                await deleteFromCloudinary(checkUser?.image)
            }
            let imageUrl = await uploadToCloudinary(image.tempFilePath)
            checkProduct.image = imageUrl
        }
        const result = await checkProduct.save()
        if (result) {
            return res.status(200).json({ success: true, msg: 'Product updated successfully', result })
        }
        return res.status(400).json({ success: false, msg: 'Failed to update product!' })
    } catch (error) {
        console.log("error on updateProduct: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}

exports.deleteProduct = async (req, res) => {
    const id = req.params?.id // product id
    const user = req.payload?._id // user id
    try {
        const checkUser = await User.findById(user)
        if (!checkUser) {
            return res.status(404).json({ success: false, msg: 'User not found!' })
        }

        const checkProdcut = await Product.findById(id)
        if (!checkProdcut) {
            return res.status(404).json({ success: false, msg: 'Product not found!' })
        }
        if (checkProdcut.image) {
            await deleteFromCloudinary(checkUser?.image)
        }
        const result = await Product.findByIdAndDelete(id)
        if (result) {
            return res.status(200).json({ success: true, msg: `Product ${checkProdcut?.name} deleted successfully` })
        }
        return res.status(404).json({ success: false, msg: "Product not found" })

    } catch (error) {
        console.log("error on deleteProduct: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}