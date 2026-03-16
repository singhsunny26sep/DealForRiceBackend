const mongoose = require("mongoose");

const MediaSchema = new mongoose.Schema(
  {
    url: { type: String },
    type: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("Media", MediaSchema);
