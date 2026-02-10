const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

exports.db = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Database connection established");
  } catch (error) {
    console.log("Error connecting to mongoDB:", error.message);
  }
};
