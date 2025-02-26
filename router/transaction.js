const express = require('express')
const { getSingleTransaction, getTransactions, createTransaction } = require('../controller/transaction')
const { verifyToken } = require('../middleware/authValidation')
const routerTransaction = express.Router()

routerTransaction.get('/get/single/:id', verifyToken, getSingleTransaction)

routerTransaction.get('/get/all', verifyToken, getTransactions)

routerTransaction.post('/buy/:id', verifyToken, createTransaction)

module.exports = routerTransaction