const mongoose = require("mongoose");

const SubscribeHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    duration: { type: Number },
    amount: { type: Number },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("SubscribeHistory", SubscribeHistorySchema);
