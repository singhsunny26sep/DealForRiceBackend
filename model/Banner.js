const mongoose = require("mongoose");

const BannerSchema = new mongoose.Schema(
  {
    mobile: { type: Number },
    email: { type: String },
    name: { type: String },
    image: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    trad: { type: mongoose.Schema.Types.ObjectId, ref: "Trade" },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("Banner", BannerSchema);
