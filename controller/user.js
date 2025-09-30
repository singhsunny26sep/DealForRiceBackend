const { generateToken } = require("../middleware/authValidation");
const User = require("../model/User");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const {
  deleteFromCloudinary,
  uploadToCloudinary,
} = require("../service/uploadImage");
const Conversation = require("../model/Conversation");
const Chat = require("../model/Chat");
const Message = require("../model/Message");
const Product = require("../model/Product");
const Trade = require("../model/Trade");
const SubscribeHistory = require("../model/SubscribeHistory");
const Transaction = require("../model/Transaction");
const {
  sendOTP,
  verifyOTP,
  urlSendTestOtp,
  urlVerifyOtp,
} = require("../service/sendOTP");
const Subscription = require("../model/Subscription");
let salt = 10;

exports.checkSubscription = async (req, res) => {
  const id = req.payload?._id;
  try {
    const user = await User.findById(id)
      .select(" -otp -__v -password")
      .populate("subscription");
    let isSubscriptionActive = false;
    const currentDate = new Date();
    // Free trial logic
    if (!user.subscriptionId) {
      // let freeTrialEndDate = new Date(user.createdAt);
      // freeTrialEndDate.setDate(freeTrialEndDate.getDate() + 7); // 7-day trial
      // if (currentDate <= freeTrialEndDate) {
      //   isSubscriptionActive = true;
      // } else {
      user.isSubscribed = false;
      isSubscriptionActive = false;
      await user.save();
      // }
    }
    // If user has a subscription
    if (user?.isSubscribed && user?.subscriptionId) {
      const checkSubscriptionHistory = await SubscribeHistory.findById(
        user?.subscriptionId
      );
      if (!checkSubscriptionHistory) {
        return res
          .status(404)
          .json({ success: false, msg: "Subscription history not found" });
      }
      if (
        checkSubscriptionHistory.endDate &&
        checkSubscriptionHistory.endDate > currentDate
      ) {
        isSubscriptionActive = true;
      } else {
        isSubscriptionActive = false;
        user.isSubscribed = false;
        user.subscriptionId = null;
        checkSubscriptionHistory.status = "inactive";
        await checkSubscriptionHistory.save();
        await user.save();
      }
    }
    res.status(200).json({ success: true, data: user, isSubscriptionActive });
  } catch (error) {
    console.log("error on checkSubscription: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.dashboardDetails = async (req, res) => {
  try {
    const [
      user,
      active,
      inactive,
      subscribedUser,
      product,
      trade,
      subscribeHistory,
      transactionCompleted,
      transactionPending,
      transactionCancelled,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", isActive: true }),
      User.countDocuments({ role: "user", isActive: false }),
      User.countDocuments({ role: "user", isSubscribed: true }),
      Product.countDocuments(),
      Trade.countDocuments(),
      SubscribeHistory.countDocuments({ status: "active" }),
      Transaction.countDocuments({ status: "completed" }),
      Transaction.countDocuments({ status: "pending" }),
      Transaction.countDocuments({ status: "cancelled" }),
      // Rate.countDocuments()
    ]);
    return res.status(200).json({
      msg: "Ok",
      success: true,
      user,
      active,
      inactive,
      subscribedUser,
      product,
      trade,
      subscribeHistory,
      transactionCompleted,
      transactionPending,
      transactionCancelled,
    });
  } catch (error) {
    console.log("error on dashboardDetails: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.userProfile = async (req, res) => {
  const id = req.params?.id || req.payload?._id;
  try {
    if (!id) {
      return res.status(400).json({
        error: "User not found",
        success: false,
        msg: "User not found",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid trade ID",
        success: false,
        msg: "Invalid trade ID",
      });
    }
    const user = await User.findById(id)
      .populate("trade")
      .populate({
        path: "subscriptionId",
        populate: { path: "subscriptionId", select: "-isActive -__V" },
      });
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        success: false,
        msg: "User not found",
      });
    }
    return res.status(200).json({ success: true, result: user });
  } catch (error) {
    console.log("error on userProfile: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.singleUser = async (req, res) => {
  const id = req.params?.id;
  try {
    if (!id) {
      return res.status(400).json({
        error: "User not found",
        success: false,
        msg: "User not found",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid trade ID",
        success: false,
        msg: "Invalid trade ID",
      });
    }
    const user = await User.findById(id).populate("trade");
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        success: false,
        msg: "User not found",
      });
    }
    return res.status(200).json({ success: true, result: user });
  } catch (error) {
    console.log("error on userProfile: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.getAllUserByTrad = async (req, res) => {
  const id = req.params?.id; //trade id
  try {
    const result = await User.find({ trade: id })
      .select("-password -role")
      .sort({ createdAt: -1 })
      .populate("trade");
    if (result) {
      return res.status(200).json({ success: true, result });
    }
    return res.status(404).json({ success: false, msg: "No users found" });
  } catch (error) {
    console.log("error on getAllUserByTrad: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.registorUser = async (req, res) => {
  const name = req.body?.name;
  const email = req.body?.email;
  const mobile = req.body?.mobile;
  const password = req.body?.password;
  const trade = req.body?.trade;
  const city = req.body?.city;
  const state = req.body?.state;
  const image = req.files?.image;
  try {
    let user;
    if (email) {
      user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({
          error: "Email already exists",
          success: false,
          msg: "Email already exists",
        });
      }
    } else if (!user && mobile) {
      user = await User.findOne({ mobile });
      if (user) {
        return res.status(400).json({
          error: "Mobile number already exists",
          success: false,
          msg: "Mobile number already exists",
        });
      }
    }
    const hashedPass = await bcrypt.hash(password, parseInt(salt));
    if (!hashedPass) {
      return res
        .status(400)
        .json({ success: false, msg: "Failed to register!" });
    }
    user = new User({ name, email, mobile, password: hashedPass });
    if (mongoose.Types.ObjectId.isValid(trade)) user.trade = trade;
    if (city) user.city = city;
    if (state) user.state = state;
    if (image) {
      let imageUrl = await uploadToCloudinary(image.tempFilePath);
      user.image = imageUrl;
    }
    user = await user.save();
    const freePlan = await Subscription.findOne({
      name: "Free for all trades",
    });
    if (!freePlan) {
      user.isSubscribed = false;
      user.subscriptionId = null;
      user = await user.save();
    }
    let freeTrialEndDate = new Date(user.createdAt);
    freeTrialEndDate.setDate(freeTrialEndDate.getDate() + 7);
    const applyFreeTrial = await SubscribeHistory.create({
      userId: user?._id,
      subscriptionId: freePlan?._id,
      endDate: freeTrialEndDate,
      duration: freePlan?.duration,
      amount: freePlan?.amount,
      status: "active",
    });
    user.subscriptionId = applyFreeTrial?._id;
    user.isSubscribed = true;
    user = await user.save();
    const token = await generateToken(user);
    return res.status(200).json({
      success: true,
      msg: `User registered successfully`,
      result,
      token,
    });
  } catch (error) {
    console.log("error on registorUser: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.completeProfile = async (req, res) => {
  console.log(
    " ============================== complete profile =================================="
  );

  const id = req.params?.id;
  const name = req.body?.name;
  const email = req.body?.email;
  const mobile = req.body?.mobile;
  const password = req.body?.password;
  const trade = req.body?.trade;
  const city = req.body?.city;
  const state = req.body?.state;
  const country = req.body?.country;
  const shopName = req.body?.shopName;
  const image = req.files?.image;

  console.log(" id: ", id);

  console.log("req.body: ", req.body);

  try {
    const checkUser = await User.findById(id);
    if (!checkUser) {
      return res.status(400).json({
        error: "User not found!",
        success: false,
        msg: "User not found!",
      });
    }
    const hashedPass = await bcrypt.hash(password, parseInt(salt));
    if (!hashedPass) {
      return res
        .status(400)
        .json({ success: false, msg: "Failed to register!" });
    }

    /* if (role) {
            if (role === "admin") {
                return res.status(400).json({ success: false, msg: "Admin role is not allowed" });
            }
        } */

    // const user = new User({ name, email, password: hashedPass })
    if (name) checkUser.name = name;
    if (email) checkUser.email = email;
    if (password) checkUser.password = hashedPass;
    if (mongoose.Types.ObjectId.isValid(trade)) {
      checkUser.trade = trade;
    }
    if (mobile) checkUser.mobile = mobile;
    if (city) checkUser.city = city;
    if (state) checkUser.state = state;
    if (country) checkUser.country = country;
    if (shopName) checkUser.shopName = shopName;

    if (image) {
      let imageUrl = await uploadToCloudinary(image.tempFilePath);
      checkUser.image = imageUrl;
    }
    checkUser.isSubscribed = true;
    const result = await checkUser.save();
    if (result) {
      const token = await generateToken(result);
      return res.status(200).json({
        success: true,
        msg: `User registered successfully`,
        result,
        token,
      });
    }
    return res.status(400).json({
      error: "Failed to register user",
      success: false,
      msg: "Failed to register user",
    });
  } catch (error) {
    console.log("error on registorUser: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.loginUser = async (req, res) => {
  // console.log("req.body: ", req.body);
  const email = req.body?.email;
  const password = req.body?.password;
  const fcmToken = req.body?.fcmToken;
  // console.log("fcmToken: ", req.body?.fcmToken);
  try {
    const checkUser = await User.findOne({ email: email });
    if (!checkUser) {
      return res.status(401).json({
        error: "Invalid credentials",
        success: false,
        msg: "Email not register yet please register first with mobile number",
      });
    }
    if (checkUser.isActive == false) {
      return res.status(401).json({
        success: false,
        msg: "Account is not active. Please contact with admin.",
      });
    }
    const matchedPass = await bcrypt.compare(password, checkUser.password);
    if (!matchedPass) {
      return res
        .status(401)
        .json({ success: false, msg: "Invalid credentials" });
    }
    if (fcmToken) {
      checkUser.fcmToken = fcmToken;
      await checkUser.save();
    }
    const token = await generateToken(checkUser);
    return res
      .status(200)
      .json({ success: true, msg: "User logged in successfully", token });
  } catch (error) {
    console.log("error on loginUser: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.loginWithMobile = async (req, res) => {
  const mobile = req.body?.mobile;
  const countryShortName = req.body?.countryShortName;
  const countryCode = req.body?.countryCode;
  try {
    let isFirst = false;
    let user;
    user = await User.findOne({ mobile: mobile });
    if (!user) {
      const hashedPass = await bcrypt.hash("123456", parseInt(salt));
      if (!hashedPass) {
        return res
          .status(400)
          .json({ success: false, msg: "Failed to register!" });
      }
      user = new User({ mobile: mobile, password: hashedPass });
      const freePlan = await Subscription.findOne({
        name: "Free for all trades",
      });
      if (!freePlan) {
        user.isSubscribed = false;
        user.subscriptionId = null;
        user = await user.save();
      }
      let freeTrialEndDate = new Date();
      freeTrialEndDate.setDate(freeTrialEndDate.getDate() + 7);
      const applyFreeTrial = await SubscribeHistory.create({
        userId: user?._id,
        subscriptionId: freePlan?._id,
        endDate: freeTrialEndDate,
        duration: freePlan?.duration,
        amount: freePlan?.amount,
        status: "active",
      });
      user.subscriptionId = applyFreeTrial?._id;
      user.isSubscribed = true;
      user = await user.save();
      isFirst = true;
    }
    if (!user.trade) isFirst = true;
    user.countryShortName = countryShortName;
    user.countryCode = countryCode;
    await user.save();
    let result = await urlSendTestOtp(mobile);
    if (result.Status == "Success") {
      return res.status(200).json({
        success: true,
        msg: "Verification code sent successfully",
        result,
        isFirst,
      });
    }
    return res
      .status(400)
      .json({ success: false, msg: "Failed to send verification code" });
  } catch (error) {
    console.log("error on loginWithMobile: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

const { sendEmailOtp } = require("../service/emailHelper");
exports.loginOrSignInWithEmail = async (req, res) => {
  const email = req.body?.email;
  const countryShortName = req.body?.countryShortName;
  const countryCode = req.body?.countryCode;
  const updatedData = {
    code: Math.floor(100000 + Math.random() * 900000).toString(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  };
  try {
    let isFirst = false;
    let user;
    user = await User.findOne({ email: email });
    if (!user) {
      const hashedPass = await bcrypt.hash("123456", parseInt(salt));
      if (!hashedPass) {
        return res
          .status(400)
          .json({ success: false, msg: "Failed to register!" });
      }
      user = new User({ email: email, password: hashedPass });
      console.log(user, "user", user.createdAt, "datatta");
      const freePlan = await Subscription.findOne({
        name: "Free for all trades",
      });
      if (!freePlan) {
        user.isSubscribed = false;
        user.subscriptionId = null;
        user = await user.save();
      }
      let freeTrialEndDate = new Date();
      freeTrialEndDate.setDate(freeTrialEndDate.getDate() + 7);
      console.log("freeTrialEndDate: ", freeTrialEndDate, user);
      const applyFreeTrial = await SubscribeHistory.create({
        userId: user?._id,
        subscriptionId: freePlan?._id,
        endDate: freeTrialEndDate,
        duration: freePlan?.duration,
        amount: freePlan?.amount,
        status: "active",
      });
      user.subscriptionId = applyFreeTrial?._id;
      user.isSubscribed = true;
      user = await user.save();
      isFirst = true;
    }
    if (!user.trade) isFirst = true;
    user.otp = updatedData;
    user.countryShortName = countryShortName;
    user.countryCode = countryCode;
    await user.save();
    let result = sendEmailOtp(email, updatedData.code);
    return res.status(200).json({
      success: true,
      msg: "Verification code sent successfully",
      result,
      isFirst,
    });
  } catch (error) {
    console.log("error on loginWithEmail: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.mobileLogin = async (req, res) => {
  const mobile = req.body?.mobile;
  const password = req.body?.password;
  const fcmToken = req.body?.fcmToken;
  try {
    const checkUser = await User.findOne({ mobile });
    if (!checkUser) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }
    if (checkUser.isActive == false) {
      return res.status(401).json({
        success: false,
        msg: "Account is not active. Please contact with admin.",
      });
    }
    const matchedPass = await bcrypt.compare(password, checkUser.password);
    if (!matchedPass) {
      return res
        .status(401)
        .json({ success: false, msg: "Invalid credentials" });
    }
    if (fcmToken) {
      checkUser.fcmToken = fcmToken;
      await checkUser.save();
    }
    const token = await generateToken(checkUser);
    return res
      .status(200)
      .json({ success: true, msg: "User logged in successfully", token });
  } catch (error) {
    console.log("error on mobileLogin: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.verifyOTPAPI = async (req, res) => {
  // console.log("req.body: ", req.body);

  const sessionId = req.body.sessionId;
  const otp = req.body.otp;
  const mobile = req.body?.mobile;
  const fcmToken = req.body?.fcmToken;
  const isFirst = req.body?.isFirst;

  console.log("mobile: ", mobile);
  console.log("sessionId: ", sessionId);
  console.log("otp: ", otp);

  try {
    const checkUser = await User.findOne({ mobile: mobile });
    console.log("checkUser: ", checkUser);

    if (!checkUser) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }
    if (checkUser.isActive == false) {
      return res.status(401).json({
        success: false,
        msg: "Account is not active. Please contact with admin.",
      });
    }
    console.log("otp: ", otp);

    let result = await urlVerifyOtp(sessionId, otp);
    console.log("result: ", result);
    if (fcmToken && result?.Status == "Success") {
      checkUser.fcmToken = fcmToken;
      await checkUser.save();
    }
    if (result?.Status == "Success") {
      const token = await generateToken(checkUser);
      return res.status(200).json({
        success: true,
        msg: "Verification successful",
        result: checkUser,
        data: result,
        token,
        isFirst,
      });
    }
    return res.status(400).json({ success: false, msg: "Verification failed" });
  } catch (error) {
    console.log("error on verifyOTP: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.verifyOTPWithEmail = async (req, res) => {
  const otp = req.body.otp;
  const email = req.body?.email;
  const fcmToken = req.body?.fcmToken;
  const isFirst = req.body?.isFirst;
  try {
    const checkUser = await User.findOne({ email: email });
    if (!checkUser || !checkUser.otp || !checkUser.otp.code) {
      return res
        .status(404)
        .json({ success: false, msg: "User or OTP not found" });
    }
    const isExpired = new Date() > checkUser.otp.expiresAt;
    if (isExpired) {
      return res.status(410).json({ success: false, msg: "OTP expired" });
    }
    if (checkUser.isActive == false) {
      return res.status(401).json({
        success: false,
        msg: "Account is not active. Please contact with admin.",
      });
    }
    if (checkUser?.otp?.code?.toString() !== otp.toString()) {
      return res.status(400).json({ success: false, msg: "Invalid OTP" });
    } else {
      if (fcmToken) {
        checkUser.fcmToken = fcmToken;
        await checkUser.save();
      }
      const token = await generateToken(checkUser);
      return res.status(200).json({
        success: true,
        msg: "Verification successful",
        result: checkUser,
        token,
        isFirst,
      });
    }
  } catch (error) {
    console.log("error on verifyOTP: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.uploadProfileImage = async (req, res) => {
  const id = req.payload._id;
  const image = req.files?.image;

  try {
    const checkUser = await User.findById(id);
    if (!checkUser) {
      return res.status(400).json({ success: false, msg: "User not found!" });
    }
    if (checkUser.image) {
      await deleteFromCloudinary(checkUser?.image);
    }
    let imageUrl = await uploadToCloudinary(image.tempFilePath);

    checkUser.image = imageUrl;
    const result = await checkUser.save();
    if (result) {
      return res.status(200).json({
        success: true,
        msg: "Profile image updated successfully",
        data: result,
      });
    }
    return res
      .status(400)
      .json({ success: false, msg: "Failed to update profile image!" });
  } catch (error) {
    console.log("error on uploadProfileImage: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.userUpdate = async (req, res) => {
  const id = req.payload._id;
  const name = req.body?.name;
  const email = req.body?.email;
  const mobile = req.body?.mobile;
  const address = req.body?.address;
  const trade = req.body?.trade;
  const city = req.body?.city;
  const state = req.body?.state;
  try {
    const checkUser = await User.findById(id);
    if (!checkUser) {
      return res.status(400).json({ success: false, msg: "User not found!" });
    }
    if (name) checkUser.name = name;
    if (email) checkUser.email = email;
    if (mobile) checkUser.mobile = mobile;
    if (address) checkUser.address = address;
    if (trade) checkUser.trade = trade;
    if (city) checkUser.city = city;
    if (state) checkUser.state = state;

    const result = await checkUser.save();
    if (result) {
      return res.status(200).json({
        success: true,
        msg: "User updated successfully",
        data: result,
      });
    }
    return res
      .status(400)
      .json({ success: false, msg: "Failed to update user!" });
  } catch (error) {
    console.log("error on userUpdate: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const result = await User.find({ role: "user" })
      .sort({ createdAt: -1 })
      .select("-password -role -__v");
    if (result) {
      return res.status(200).json({ success: true, result });
    }
    return res.status(404).json({ success: false, msg: "No users found" });
  } catch (error) {
    console.log("error on getAllUsers: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.getAllUserForChat = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.payload?._id);
  const tradeId = req.query.tradeId;
  const name = req.query?.name;
  const mobile = req.query?.mobile;
  const shopName = req.query?.shopName;
  const city = req.query?.city;
  const state = req.query?.state;
  const country = req.query?.country;
  const address = req.query?.address;
  try {
    const matchQuery = { role: "user", _id: { $ne: userId } };

    if (tradeId) {
      matchQuery.trade = new mongoose.Types.ObjectId(tradeId);
    }
    if (name) {
      matchQuery.name = { $regex: name, $options: "i" }; // 'i' for case-insensitive
    }
    if (mobile) {
      matchQuery.mobile = { $regex: mobile, $options: "i" };
    }
    if (address) {
      matchQuery.address = { $regex: address, $options: "i" };
    }
    if (city) {
      matchQuery.city = { $regex: city, $options: "i" };
    }
    if (state) {
      matchQuery.state = { $regex: state, $options: "i" };
    }
    if (country) {
      matchQuery.country = { $regex: country, $options: "i" };
    }
    if (shopName) {
      matchQuery.shopName = { $regex: shopName, $options: "i" };
    }

    const usersWithLastMessage = await User.aggregate([
      { $match: matchQuery }, // Match users based on role and tradeId conditionally
      {
        $lookup: {
          from: "chats",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        { $eq: ["$sender", userId] },
                        { $eq: ["$receiver", "$$userId"] },
                      ],
                    },
                    {
                      $and: [
                        { $eq: ["$receiver", userId] },
                        { $eq: ["$sender", "$$userId"] },
                      ],
                    },
                  ],
                },
              },
            },
            { $sort: { createdAt: -1 } }, // Get the latest message
            { $limit: 1 },
          ],
          as: "lastChat",
        },
      },
      {
        $lookup: {
          from: "chats",
          let: { senderId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$sender", "$$senderId"] }, // Messages from this user
                    { $eq: ["$receiver", userId] }, // To logged-in user
                    { $ne: [`$readBy.${userId}`, true] }, // Unread messages
                  ],
                },
              },
            },
          ],
          as: "unreadMessages",
        },
      },
      {
        $lookup: {
          from: "trades",
          localField: "trade",
          foreignField: "_id",
          as: "tradeDetails",
        },
      },
      {
        $addFields: {
          tradeDetails: { $arrayElemAt: ["$tradeDetails", 0] }, // convert array to object
          lastMessage: { $arrayElemAt: ["$lastChat.message", 0] },
          lastMessageTime: { $arrayElemAt: ["$lastChat.createdAt", 0] },
          unreadCount: { $size: "$unreadMessages" }, // Count all unread messages
        },
      },
      {
        $project: {
          password: 0,
          role: 0,
          __v: 0,
          lastChat: 0,
          unreadMessages: 0,
        },
      },
      {
        $sort: { lastMessageTime: -1 }, // Sort by latest message time
      },
    ]);
    // console.log("usersWithLastMessage: ", usersWithLastMessage);
    return res
      .status(200)
      .json({ success: true, result: usersWithLastMessage });
  } catch (error) {
    console.error("Error on getAllUsers: ", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.changeStatusUser = async (req, res) => {
  const id = req.params?.id; //user id
  const status = req.body?.status; //status (online, offline, busy)

  try {
    const checkUser = await User.findById(id);
    if (!checkUser) {
      return res.status(400).json({ success: false, msg: "User not found!" });
    }
    checkUser.isActive = status;
    const result = await checkUser.save();
    if (result) {
      return res.status(200).json({
        success: true,
        msg: "User status updated successfully",
        data: result,
      });
    }
    return res
      .status(400)
      .json({ success: false, msg: "Failed to update user status!" });
  } catch (error) {
    console.log("error on changeStatusUser: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.sendTestOtp = async (req, res) => {
  const mobile = req.body?.mobile;
  try {
    let result = await urlSendTestOtp(mobile);
    console.log("result: ", result);

    return res
      .status(200)
      .json({ success: false, msg: "Failed to update user status!", result });
  } catch (error) {
    console.log("error on sendTestOtp: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  const mobile = req.body?.mobile;
  const otp = req.body?.otp;
  const sessionId = req.body?.sessionId;
  const password = req.body?.password;
  try {
    const checkUser = await User.findOne({ mobile });
    if (!checkUser) {
      return res.status(400).json({ success: false, msg: "User not found!" });
    }
    // let result = await verifyOTP(sessionId, otp)
    let result = await urlVerifyOtp(sessionId, otp);
    if (result.Status == "Success") {
      const hashedPass = await bcrypt.hash(password, parseInt(salt));
      checkUser.password = hashedPass;

      await checkUser.save();
      return res
        .status(200)
        .json({ success: true, msg: "Password reset successfully!", result });
    }
    return res
      .status(400)
      .json({ success: false, msg: "Failed to verify OTP!", result });
  } catch (error) {
    console.log("error on verifyOTP: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const id = req.params?.id;
  try {
    const checkUser = await User.findById(id);
    if (!checkUser) {
      return res.status(400).json({ success: false, msg: "User not found!" });
    }
    const result = await User.findByIdAndDelete(id);
    if (result) {
      return res
        .status(200)
        .json({ success: true, msg: "User deleted successfully!", result });
    }
    return res
      .status(400)
      .json({ success: false, msg: "Failed to delete user!" });
  } catch (error) {
    console.log("error on deleteUser: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};
