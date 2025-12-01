const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const Chat = require("../model/Chat");
const User = require("../model/User");
const app = express();
const server = http.createServer(app);

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
    console.log("Updated Online Users:", Array.from(onlineUsers.keys()));
    io.emit("online_users", Array.from(onlineUsers.keys()));
  });

  socket.on("join_room", async ({ userId, receiverId }) => {
    const roomId = [userId, receiverId].sort().join("_");
    socket.join(roomId);
    const messages = await Chat.find({ roomId }).sort({ createdAt: 1 });
    socket.emit("loadMessages", messages);
  });

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
    await User.findByIdAndUpdate(receiver, {
      lastMessage: message,
      lastMessageTime: new Date(),
    });
    io.emit("msg");
    io.to(roomId).emit("receiveMessage", newMessage);
    if (!onlineUsers.has(receiver)) {
      await User.findByIdAndUpdate(receiver, { $inc: { unreadCount: 1 } });
    }
  });

  socket.on("seenMessages", async ({ userId, senderId }) => {
    const roomId = [userId, senderId].sort().join("_");
    await Chat.updateMany(
      { roomId, receiver: userId, seen: false },
      { seen: true, $set: { [`readBy.${userId}`]: true } }
    );
    await User.findByIdAndUpdate(userId, { unreadCount: 0 });
    io.to(roomId).emit("messagesSeen", { userId, senderId });
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("online_users", Array.from(onlineUsers.keys()));
    console.log("User Disconnected:", socket.id);
  });
});

module.exports = { app, io, server };
