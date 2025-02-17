const express = require("express")
const { getMessage, sendMessage } = require("../controller/message.js");
const protectRoute = require("../middleware/protectRoute.js");
const router = express.Router();

router.get('/:id', protectRoute, getMessage)

router.post('/send/:id', protectRoute, sendMessage)

module.exports = router