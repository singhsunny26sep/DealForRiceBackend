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
    isActive: { type: Boolean, default: true },
    isSubscribed: { type: Boolean, default: false },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscribeHistory",
    },
    fcmToken: { type: String },
    countryCode: { type: String },
    isOnline: { type: Boolean, default: false },
    countryShortName: { type: String },
    lastMessage: String,
    lastMessageTime: Date,
    unreadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const User = mongoose.model("User", UserSchema);

module.exports = User;
