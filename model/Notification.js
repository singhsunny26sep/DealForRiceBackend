const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String },
    message: { type: String },
    image: { type: String },
    seen: { type: Boolean, default: false },
    targetType: {
      type: String,
      enum: [
        "User",
        "Product",
        "Trade",
        "Subscription",
        "Message",
        "Notification",
      ],
      default: "Notification",
    },
    action: {
      type: String,
      enum: [
        "like",
        "comment",
        "reply",
        "follow",
        "subscribe",
        "unsubscribe",
        "purchase",
        "sell",
        "trade",
        "subscription",
        "message",
        "notification",
        "added",
      ],
      default: "notification",
    },
    data: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("Notification", NotificationSchema);
