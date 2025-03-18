const express = require('express')
const { getAllProducts, addProduct, updateProduct, deleteProduct, getProductByUserId, getLatestProducts, getAdminProduct } = require('../controller/product')
const { verifyToken } = require('../middleware/authValidation')
const proRouter = express.Router()

proRouter.get('/latestProduct', getLatestProducts)

proRouter.get('/', getAllProducts)

proRouter.get('/adminProducts', getAdminProduct)

proRouter.get('/:id', getAllProducts)

proRouter.get('/brand/user/:id', getProductByUserId)

proRouter.post('/brand/add', verifyToken, addProduct)

proRouter.put('/brand/update/:id', verifyToken, updateProduct)

proRouter.delete('/brand/delete/:id', verifyToken, deleteProduct)


module.exports = proRouter