const express = require("express");
require("dotenv").config();
const fs = require("fs");
const mongoose = require("mongoose");
const ngrok = require("ngrok");
const morgan = require("morgan");
const port = process.env.PORT || 4000;
const fileUpload = require("express-fileupload");
const { db } = require("./db/db");
const cors = require("cors");
const startSubscriptionCron = require("./jobs/expireSubscribedPlan.js");
const userRouter = require("./router/user");
const tradeRouter = require("./router/trade");
const proRouter = require("./router/product");
const { app, server } = require("./soket/socket.js");
const messageRouter = require("./router/message.js");
const routerTransaction = require("./router/transaction.js");
const subscribeRouter = require("./router/subscription.js");
const notifyRouter = require("./router/notification.js");
const bannerRouter = require("./router/banner.js");
const mediaRouter = require("./router/media.js");

db();
app.use(cors({ origin: "*" })); // Allow all origins (you can restrict to specific origins)
app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp/" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => res.send("Hello World!"));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/trades", tradeRouter);
app.use("/api/v1/products", proRouter);
app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/transactions", routerTransaction);
app.use("/api/v1/subscriptions", subscribeRouter);
app.use("/api/v1/notifications", notifyRouter);
app.use("/api/v1/banners", bannerRouter);
app.use("/api/v1/medias", mediaRouter);

app.get("/upload-user", async (req, res) => {
  const rawData = fs.readFileSync("./riceapp-3e60d-default-rtdb-export.json");
  const data = JSON.parse(rawData);
  const chats = data.chats;
  const users = [];
  for (const chatId in chats) {
    const chat = chats[chatId];
    const lastMsg = chat.lastAct?.lastMsg || "";
    const lastMsgTime = chat.lastAct?.lastMsgTime
      ? new Date(chat.lastAct.lastMsgTime)
      : null;
    const messageKeys = Object.keys(chat.messages || {});
    const senderIds = new Set();
    messageKeys.forEach((msgKey) => {
      const msg = chat.messages[msgKey];
      if (msg?.senderId) senderIds.add(msg.senderId);
    });
    senderIds.forEach((senderId) => {
      const userObj = {
        mobile: /^\d{10}$/.test(lastMsg) ? lastMsg : undefined,
        lastMessage: lastMsg,
        lastMessageTime: lastMsgTime,
        password: "default123",
        role: "user",
        isActive: true,
        isSubscribed: false,
        unreadCount: 0,
        _id: undefined,
      };
      users.push({
        ...userObj,
        _id: new mongoose.Types.ObjectId(),
        name: "Firebase User",
        email: `${senderId}@firebaseapp.com`,
        fcmToken: senderId,
      });
    });
  }
  const uniqueUsers = Array.from(
    new Map(users.map((u) => [u.email, u])).values(),
  );
  /* const result = await User.insertMany(uniqueUsers, { ordered: false }).catch(err => {
        console.error("Insert errors (likely duplicates):", err.writeErrors?.length || err);
    }); */
  return res.status(200).json({ success: true, result: uniqueUsers });
});
startSubscriptionCron();
// server.listen(port, () => {
//   console.log(`Example app listening on port ${port}!`);
// });

server.listen(port, async () => {
  console.log(`Server running on http://localhost:${port}`);

  if (process.env.ENABLE_NGROK === "true") {
    const url = await ngrok.connect({
      addr: port,
      authtoken: process.env.NGROK_AUTH_TOKEN,
      // subdomain: process.env.NGROK_SUBDOMAIN // must be set for custom subdomain
    });
    console.log(`Public URL: ${url}`);
  }
});
