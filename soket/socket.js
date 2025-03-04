const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const Chat = require("../model/Chat");
const User = require("../model/User");
const cors = require('cors');


const app = express();
const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: "*" } });
const io = new Server(server, {
    cors: {
        origin: "*", // Change this to your frontend URL if needed (e.g., http://localhost:3000)
        methods: ["GET", "POST"]
    }
});



/* const userSocketMap = {}; // { userId: socketId }
const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};
*/

/* io.on("connection", (socket) => {
    const userId = socket.handshake.query?.userId;
    console.log("socket Connected: ", userId);

    if (userId !== "undefined") {
        userSocketMap[userId] = socket.id;
    }

    // Emit online users to all clients
    io.emit("getOnlineUser", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        delete userSocketMap[userId];
        io.emit("getOnlineUser", Object.keys(userSocketMap));
    });
}); */

// Store online users
const onlineUsers = new Map();

// Socket.IO Events
io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    // Handle User Online
    /* socket.on("user_online", async (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log("online user: ", onlineUsers);

        io.emit("online_users", Array.from(onlineUsers.keys()));
    }); */
    socket.on("user_online", async (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log("Updated Online Users:", Array.from(onlineUsers.keys())); // Debugging log
        io.emit("online_users", Array.from(onlineUsers.keys()));
    });

    // Handle User Joining Chat Room
    socket.on("join_room", async ({ userId, receiverId }) => {
        const roomId = [userId, receiverId].sort().join("_");
        socket.join(roomId);

        // Load previous messages
        const messages = await Chat.find({ roomId }).sort({ createdAt: 1 });
        socket.emit("loadMessages", messages);
    });

    // Handle Sending Messages
    socket.on("sendMessage", async ({ sender, receiver, message }) => {
        const roomId = [sender, receiver].sort().join("_");

        // Save message in DB
        const newMessage = new Chat({ roomId, sender, receiver, message, readBy: { [sender]: true, [receiver]: false } });
        await newMessage.save();

        // Update last message for user list
        await User.findByIdAndUpdate(receiver, { lastMessage: message, lastMessageTime: new Date() });

        // Broadcast message to room
        io.to(roomId).emit("receiveMessage", newMessage);

        // If user is offline, increase unread count
        if (!onlineUsers.has(receiver)) {
            await User.findByIdAndUpdate(receiver, { $inc: { unreadCount: 1 } });
        }
    });

    // Handle User Seen Messages
    socket.on("seenMessages", async ({ userId, senderId }) => {
        const roomId = [userId, senderId].sort().join("_");

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
