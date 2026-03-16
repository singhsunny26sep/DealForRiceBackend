const mongoose = require("mongoose");

const TradeSchema = new mongoose.Schema(
  {
    name: { type: String },
    description: { type: String },
    tradeType: { type: String },
    image: { type: String },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("Trade", TradeSchema);
