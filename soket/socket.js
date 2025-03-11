const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const Chat = require("../model/Chat");
const User = require("../model/User");


const app = express();
const server = http.createServer(app);


const io = new Server(server, {
    cors: {
        origin: "*", // Allows connections from any origin (not recommended for production)
        methods: ["GET", "POST"] // Allows only GET and POST requests
    }
});


// Store online users
const onlineUsers = new Map();

// Socket.IO Events
io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);


    socket.on("user_online", async (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log("Updated Online Users:", Array.from(onlineUsers.keys())); // Debugging log
        io.emit("online_users", Array.from(onlineUsers.keys()));
    });

    // Handle User Joining Chat Room
    socket.on("join_room", async ({ userId, receiverId }) => {
        // console.log(" ====================================== Joined chat room ====================================== ");

        const roomId = [userId, receiverId].sort().join("_");
        socket.join(roomId);
        // console.log("join room: ", roomId);
        // console.log("join room: userId ", userId);
        // console.log("join room: receiverId ", receiverId);

        // Load previous messages
        const messages = await Chat.find({ roomId }).sort({ createdAt: 1 });
        // console.log("messages: ", messages);

        socket.emit("loadMessages", messages);
    });

    // Handle Sending Messages
    socket.on("sendMessage", async ({ sender, receiver, message }) => {
        // console.log(" ====================================== sendMessage ====================================== ");
        const roomId = [sender, receiver].sort().join("_");

        // console.log("sender: ", sender);
        // console.log("receiver: ", receiver);
        // console.log("message: ", message);

        // Save message in DB
        const newMessage = new Chat({ roomId, sender, receiver, message, readBy: { [sender]: true, [receiver]: false } });
        await newMessage.save();

        // console.log("newMessage: ", newMessage);

        // Update last message for user list
        await User.findByIdAndUpdate(receiver, { lastMessage: message, lastMessageTime: new Date() });

        io.emit("msg")
        // Broadcast message to room
        io.to(roomId).emit("receiveMessage", newMessage);

        // If user is offline, increase unread count
        if (!onlineUsers.has(receiver)) {
            await User.findByIdAndUpdate(receiver, { $inc: { unreadCount: 1 } });
        }
    });

    // Handle User Seen Messages
    socket.on("seenMessages", async ({ userId, senderId }) => {
        // console.log(" ====================================== seenMessages ====================================== ");
        const roomId = [userId, senderId].sort().join("_");

        // console.log("roomId: ", roomId);

        // Mark messages as seen
        await Chat.updateMany({ roomId, receiver: userId, seen: false }, { seen: true, $set: { [`readBy.${userId}`]: true } });

        // Reset unread count
        await User.findByIdAndUpdate(userId, { unreadCount: 0 });

        io.to(roomId).emit("messagesSeen", { userId, senderId });
    });


    // Handle User Disconnection
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

// module.exports = { app, io, server, getReceiverSocketId };
module.exports = { app, io, server };
