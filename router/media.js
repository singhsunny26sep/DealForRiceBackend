const express = require('express')
const { verifyToken } = require('../middleware/authValidation')
const { uploadImageChat } = require('../controller/chat')
const mediaRouter = express.Router()

mediaRouter.post('/uploadImage', verifyToken, uploadImageChat)

module.exports = mediaRouter