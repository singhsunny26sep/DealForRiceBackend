const express = require('express')
// const app = express()
require('dotenv').config()
const port = process.env.PORT || 4000
const fileUpload = require('express-fileupload');
const { db } = require('./db/db');
const cors = require('cors');
const userRouter = require('./router/user');
const tradeRouter = require('./router/trade');
const proRouter = require('./router/product');
const { app, server } = require('./soket/socket.js')
const messageRouter = require('./router/message.js');
const routerTransaction = require('./router/transaction.js');
const subscribeRouter = require('./router/subscription.js');

db()
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/', }));
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => res.send('Hello World!'))

app.use('/api/v1/users', userRouter)
app.use('/api/v1/trades', tradeRouter)
app.use('/api/v1/products', proRouter)
app.use('/api/v1/messages', messageRouter)
app.use('/api/v1/transactions', routerTransaction)
app.use('/api/v1/subscriptions', subscribeRouter)


server.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
})