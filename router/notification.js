const express = require('express')
const { verifyToken } = require('../middleware/authValidation')
const { getNotification, sendTestNotification } = require('../controller/notification')
const notifyRouter = express.Router()

notifyRouter.get('/byUser/:id', verifyToken, getNotification)

notifyRouter.post('/testSend', sendTestNotification)

module.exports = notifyRouter