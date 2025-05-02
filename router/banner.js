const express = require('express')
const { getAllBanner, addBanner, updateBanner, deleteBanner, paginationBanner } = require('../controller/banner')
const { verifyToken } = require('../middleware/authValidation')
const bannerRouter = express.Router()

bannerRouter.get('/getAll', getAllBanner)
bannerRouter.get('/getOne/:id', getAllBanner)

bannerRouter.get('/pagination', paginationBanner)

bannerRouter.post('/add', verifyToken, addBanner)

bannerRouter.put('/update/:id', verifyToken, updateBanner)

bannerRouter.delete('/delete/:id', verifyToken, deleteBanner)

module.exports = bannerRouter