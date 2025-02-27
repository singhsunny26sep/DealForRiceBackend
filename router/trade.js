const express = require('express');
const { getTrade, addOrUpdateTrade, deleteTrade, getPaginationTrand } = require('../controller/trade');
const tradeRouter = express.Router();

tradeRouter.get('/', getTrade)

tradeRouter.get('/pagination', getPaginationTrand)
tradeRouter.get('/:id', getTrade)


tradeRouter.post('/', addOrUpdateTrade)

tradeRouter.put('/:id', addOrUpdateTrade)

tradeRouter.delete('/:id', deleteTrade)


module.exports = tradeRouter