const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readBy: {
      type: Map, // Store read status for both users
      of: Boolean,
      default: {},
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("Message", messageSchema);
