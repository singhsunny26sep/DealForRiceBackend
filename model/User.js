const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    mobile: { type: String },
    password: { type: String },
    trade: { type: mongoose.Schema.Types.ObjectId, ref: "Trade" },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin", "manager"],
    },
    otp: { code: String, expiresAt: Date },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    shopName: { type: String },
    image: { type: String },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscribeHistory",
    },
    fcmToken: { type: String },
    countryCode: { type: String },
    lastSeen: { type: Date },
    countryShortName: { type: String },
    lastMessage: String,
    lastMessageTime: Date,
    unreadCount: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false },
    isSubscribed: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("User", UserSchema);
