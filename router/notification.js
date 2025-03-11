const express = require('express')
const { verifyToken } = require('../middleware/authValidation')
const { getNotification } = require('../controller/notification')
const notifyRouter = express.Router()

notifyRouter.get('/byUser/:id', verifyToken, getNotification)

notifyRouter.post('/testSend',)

module.exports = notifyRouter