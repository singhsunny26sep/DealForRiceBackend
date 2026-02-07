const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const Chat = require("../model/Chat");
const User = require("../model/User");
const app = express();
const server = http.createServer(app);
const { sendPushNotification } = require("../service/notification");

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);
  socket.on("user_online", async (userId) => {
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
    });
    // Broadcast (existing + improved)
    io.emit("online_users", Array.from(onlineUsers.keys()));
    console.log("Online Users:", [...onlineUsers.keys()]);
  });

  //-----------------------------------------
  // 🟢 JOIN ROOM
  //-----------------------------------------
  socket.on("join_room", async ({ userId, receiverId }) => {
    const roomId = [userId, receiverId].sort().join("_");
    console.log(`User ${userId} joined room: ${roomId}`);
    socket.join(roomId);
    const messages = await Chat.find({ roomId }).sort({ createdAt: 1 });
    socket.emit("loadMessages", messages);
  });

  //-----------------------------------------
  // 🟢 SEND MESSAGE
  //-----------------------------------------
  socket.on("sendMessage", async ({ sender, receiver, message, image }) => {
    const roomId = [sender, receiver].sort().join("_");
    const newMessage = new Chat({
      roomId,
      sender,
      receiver,
      message,
      image,
      readBy: { [sender]: true, [receiver]: false },
    });
    await newMessage.save();
    console.log(`Message from ${sender} to ${receiver}: ${message}`);
    await User.findByIdAndUpdate(receiver, {
      lastMessage: message,
      lastMessageTime: new Date(),
    });
    io.emit("msg");
    io.to(roomId).emit("receiveMessage", newMessage);
    // If user is offline or app in background → send push notification
    if (!onlineUsers.has(receiver)) {
      await User.findByIdAndUpdate(receiver, { $inc: { unreadCount: 1 } });
      // Send push notification
      sendPushNotification(receiver, {
        title: "New Message",
        body: `${newMessage.message}`,
        senderId: sender,
      });
    }
  });

  //-----------------------------------------
  // 🟢 SEEN MESSAGES
  //-----------------------------------------
  socket.on("seenMessages", async ({ userId, senderId }) => {
    const roomId = [userId, senderId].sort().join("_");
    await Chat.updateMany(
      { roomId, receiver: userId, seen: false },
      { seen: true, $set: { [`readBy.${userId}`]: true } },
    );
    await User.findByIdAndUpdate(userId, { unreadCount: 0 });
    io.to(roomId).emit("messagesSeen", { userId, senderId });
  });

  //-----------------------------------------
  // 🔴 USER DISCONNECT (OFFLINE)
  //-----------------------------------------
  socket.on("disconnect", async () => {
    let disconnectedUser = null;
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUser = userId;
        onlineUsers.delete(userId);
        break;
      }
    }
    // NEW — Update user offline in DB
    if (disconnectedUser) {
      await User.findByIdAndUpdate(disconnectedUser, {
        isOnline: false,
        lastSeen: new Date(),
      });
    }
    // Broadcast updated list
    io.emit("online_users", Array.from(onlineUsers.keys()));
    console.log("User Disconnected:", socket.id);
  });
});

module.exports = { app, io, server };
