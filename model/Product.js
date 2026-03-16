const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number },
    image: { type: String },
    trade: { type: mongoose.Schema.Types.ObjectId, ref: "Trade" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("Product", ProductSchema);
