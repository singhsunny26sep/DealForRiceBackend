const express = require('express')
const { verifyToken } = require('../middleware/authValidation')
const { getSubscriptions, getActiveSubscriptions, addSubscription, updateSubscription, changeStatus, deleteSbuscription, applySubscription, getUserSubscription, adminChangeUserSubscriptionHistory, userSubscriptionHistory } = require('../controller/subscription')
const subscribeRouter = express.Router()

subscribeRouter.get('/', getSubscriptions)
subscribeRouter.get('/:id', getSubscriptions)

subscribeRouter.get('/users/subscriptionList', getActiveSubscriptions)

subscribeRouter.post('/', verifyToken, addSubscription)
subscribeRouter.put('/:id', verifyToken, updateSubscription)

subscribeRouter.put('/changeStatus/:id', verifyToken, changeStatus)

subscribeRouter.delete('/:id', verifyToken, deleteSbuscription)

subscribeRouter.post('/apply/subscrition/:id', verifyToken, applySubscription) //here will be subscription id

subscribeRouter.get('/subscribed/user', verifyToken, getUserSubscription)

subscribeRouter.put('/change/user/subscription/:id', verifyToken, adminChangeUserSubscriptionHistory) //here will be subscription history id

subscribeRouter.get('/history/user/subscription/:id', verifyToken, userSubscriptionHistory)

subscribeRouter.get('/history/user/subscription', verifyToken, userSubscriptionHistory)

module.exports = subscribeRouter