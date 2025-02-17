const { Server } = require("socket.io");
const https = require("https");
const express = require("express");

const app = express();
const server = https.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const userSocketMap = {}; // { userId: socketId }

const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
    const userId = socket.handshake.query?.userId;

    if (userId !== "undefined") {
        userSocketMap[userId] = socket.id;
    }

    // Emit online users to all clients
    io.emit("getOnlineUser", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        delete userSocketMap[userId];
        io.emit("getOnlineUser", Object.keys(userSocketMap));
    });
});

module.exports = { app, io, server, getReceiverSocketId };
