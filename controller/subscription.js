const SubscribeHistory = require("../model/SubscribeHistory");
const Subscription = require("../model/Subscription");
const Transaction = require("../model/Transaction");
const User = require("../model/User");
const Razorpay = require("razorpay");
const { verifySignature } = require("../service/razorPay");

const razorPyaSecret = process.env.RAZOR_SECRET_KEY;
const instance = new Razorpay({
  key_id: process.env.RAZOR_KEY_ID,
  key_secret: process.env.RAZOR_SECRET_KEY,
});

exports.getSubscriptions = async (req, res) => {
  const id = req.params?.id;
  try {
    if (id) {
      const subscription = await Subscription.findById(id).populate("trade");
      if (!subscription) {
        return res
          .status(404)
          .json({ success: false, msg: "Subscription not found" });
      }
      return res.status(200).json({
        success: true,
        msg: "Subscription found",
        result: subscription,
      });
    }
    const subscriptions = await Subscription.find()
      .sort({ createdAt: -1 })
      .populate("trade");
    if (!subscriptions) {
      return res
        .status(404)
        .json({ success: false, msg: "No subscriptions found" });
    }
    return res.status(200).json({
      success: true,
      msg: "Subscriptions found",
      result: subscriptions,
    });
  } catch (error) {
    console.error("Error on getSubscriptions: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getActiveSubscriptions = async (req, res) => {
  try {
    const result = await Subscription.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate("trade");
    if (!result) {
      return res
        .status(404)
        .json({ success: false, msg: "No active subscriptions found" });
    }
    return res
      .status(200)
      .json({ success: true, msg: "Active subscriptions found", result });
  } catch (error) {
    console.error("Error on getActiveSubscriptions: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.subscriptionListWithUser = async (req, res) => {
  const userId = req.payload?._id;
  try {
    const checkUser = await User.findById(userId);
    if (!checkUser) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }
    const result = await Subscription.find({
      isActive: true,
      trade: checkUser.trade,
    });
    if (!result) {
      return res.status(404).json({
        success: false,
        msg: "No active subscriptions found for this trade",
      });
    }
    return res.status(200).json({
      success: true,
      msg: "Active subscriptions found for this trade",
      result,
    });
  } catch (error) {
    console.error("Error on subscriptionListWithUser: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.addSubscription = async (req, res) => {
  const name = req.body?.name;
  const amount = req.body?.amount;
  const description = req.body?.description;
  const duration = req.body?.duration;
  const trade = req.body?.trade;
  try {
    const result = await Subscription.create({
      name,
      amount,
      description,
      duration,
      trade,
    });
    if (result) {
      return res.status(201).json({
        success: true,
        msg: "Subscription added successfully",
        result,
      });
    }
    return res
      .status(400)
      .json({ success: false, msg: "Failed to add subscription" });
  } catch (error) {
    console.error("Error on addSubscription: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.updateSubscription = async (req, res) => {
  const id = req.params?.id;
  const name = req.body?.name;
  const amount = req.body?.amount;
  const description = req.body?.description;
  const duration = req.body?.duration;
  const trade = req.body?.trade;
  try {
    const checkSubscription = await Subscription.findById(id);
    if (!checkSubscription) {
      return res
        .status(404)
        .json({ success: false, msg: "Subscription not found" });
    }
    if (name) checkSubscription.name = name;
    if (amount) checkSubscription.amount = amount;
    if (description) checkSubscription.description = description;
    if (duration) checkSubscription.duration = duration;
    if (trade) checkSubscription.trade = trade;
    const result = await checkSubscription.save();
    if (result) {
      return res.status(200).json({
        success: true,
        msg: "Subscription updated successfully",
        result,
      });
    }
    return res
      .status(400)
      .json({ success: false, msg: "Failed to update subscription" });
  } catch (error) {
    console.error("Error on updateSubscription: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.deleteSbuscription = async (req, res) => {
  const id = req.params?.id;
  try {
    const checkSubscription = await Subscription.findById(id);
    if (!checkSubscription) {
      return res
        .status(404)
        .json({ success: false, msg: "Subscription not found" });
    }
    const result = await Subscription.findByIdAndDelete(id);
    if (result) {
      return res
        .status(200)
        .json({ success: true, msg: "Subscription deleted successfully" });
    }
    return res
      .status(400)
      .json({ success: false, msg: "Failed to delete subscription" });
  } catch (error) {
    console.error("Error on addSubscription: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.changeStatus = async (req, res) => {
  const id = req.params?.id;
  const isActive = req.body?.isActive;
  try {
    const checkSubscription = await Subscription.findById(id);
    if (!checkSubscription) {
      return res
        .status(404)
        .json({ success: false, msg: "Subscription not found" });
    }
    checkSubscription.isActive = isActive;
    const result = await checkSubscription.save();
    if (result) {
      return res.status(200).json({
        success: true,
        msg: "Subscription status updated successfully",
        result,
      });
    }
    return res
      .status(400)
      .json({ success: false, msg: "Failed to update subscription status" });
  } catch (error) {
    console.error("Error on changeStatus: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};

// ======================================== vendor ===================================

exports.createOrderSubscription = async (req, res) => {
  const id = req.params?.id;
  const userId = req.payload?._id;
  try {
    const checkSubscription = await Subscription.findById(id);
    if (!checkSubscription) {
      return res
        .status(404)
        .json({ success: false, msg: "Subscription not found" });
    }
    const checkUser = await User.findById(userId);
    if (!checkUser) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }
    if (checkUser.isSubscribed == true) {
      return res
        .status(400)
        .json({ success: false, msg: "Subscription is already taken." });
    }
    const activeSubscription = await SubscribeHistory.findOne({
      _id: checkUser?.subscriptionId,
      // status: 'active',
      endDate: { $gt: new Date() },
    });
    if (activeSubscription) {
      return res.status(400).json({
        success: false,
        msg: `Subscription is already taken. Please contact to admin.`,
      });
    }
    let amount = Number(checkSubscription?.amount) * 100;
    const options = {
      amount: amount,
      currency: "INR",
      receipt: "receipt#1",
      partial_payment: false,
      notes: {
        username: checkUser?.name,
        email: checkUser?.email,
        moibile: checkUser?.mobile,
      },
    };
    instance.orders.create(options, async (err, order) => {
      if (err) {
        return res
          .status(401)
          .json({ msg: "Failed to genarate payment order!", success: false });
      }
      const result = await Transaction.create({
        userId,
        subscriptionId: id,
        orderId: order.id,
        price: order.amount / 100,
      });
      if (result) {
        return res.status(201).json({
          msg: "Order created successfully.",
          success: true,
          result,
          order,
        });
      }
      return res
        .status(400)
        .json({ msg: "Failed to initiate payment!", success: false });
    });
  } catch (error) {
    console.error("Error on applySubscription: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.applySubscription = async (req, res) => {
  const txnId = req.params?.id;
  const userId = req.payload?._id;
  const razorpay_signature = req.body.data.razorpay_signature;
  const razorpay_order_id = req.body.data.razorpay_order_id;
  const razorpay_payment_id = req.body.data.razorpay_payment_id;
  try {
    const checkTxn = await Transaction.findById(txnId);
    if (!checkTxn) {
      return res
        .status(404)
        .json({ success: false, msg: "Transaction not found" });
    }
    const isValid = verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorPyaSecret
    );
    if (!isValid) {
      await Transaction.updateOne(
        { orderId: razorpay_order_id },
        { $set: { status: "failed" } }
      );
      return res
        .status(400)
        .json({ msg: "Failed to verify payment!", success: false });
    }
    const checkSubscription = await Subscription.findById(
      checkTxn?.subscriptionId
    );
    if (!checkSubscription) {
      await Transaction.updateOne(
        { orderId: razorpay_order_id },
        { $set: { status: "failed" } }
      );
      return res
        .status(404)
        .json({ success: false, msg: "Subscription not found" });
    }
    const checkUser = await User.findById(userId);
    if (!checkUser) {
      await Transaction.updateOne(
        { orderId: razorpay_order_id },
        { $set: { status: "failed" } }
      );
      return res.status(404).json({ success: false, msg: "User not found" });
    }
    if (checkUser.isSubscribed == true) {
      await Transaction.updateOne(
        { orderId: razorpay_order_id },
        { $set: { status: "failed" } }
      );
      return res
        .status(400)
        .json({ success: false, msg: "Subscription is already taken." });
    }
    const activeSubscription = await SubscribeHistory.findOne({
      _id: checkUser?.subscriptionId,
      // status: 'active',
      endDate: { $gt: new Date() },
    });
    if (activeSubscription) {
      await Transaction.updateOne(
        { orderId: razorpay_order_id },
        { $set: { status: "failed" } }
      );
      return res.status(400).json({
        success: false,
        msg: `Subscription is already taken. Please contact to admin.`,
      });
    }
    const subscriptionDate = new Date();
    let expirationDate = new Date(subscriptionDate);
    expirationDate.setMonth(
      expirationDate.getMonth() + checkSubscription.duration
    );
    checkUser.isSubscribed = true;
    const result = await SubscribeHistory.create({
      userId,
      transactionId: checkTxn?._id,
      subscriptionId: checkTxn?.subscriptionId,
      startDate: subscriptionDate,
      endDate: expirationDate,
      status: "active",
      duration: checkSubscription.duration,
      amount: checkSubscription?.amount,
    });
    await Transaction.updateOne(
      { orderId: razorpay_order_id },
      { $set: { status: "completed" } }
    );
    checkUser.subscriptionId = result?._id;
    if (result) {
      await checkUser.save();
      return res.status(200).json({
        success: true,
        msg: "Subscription applied successfully",
        result,
      });
    }
    return res
      .status(400)
      .json({ success: false, msg: "Failed to apply subscription" });
  } catch (error) {
    console.error("Error on applySubscription: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getUserSubscription = async (req, res) => {
  try {
    // const result = await User.find().select("-password -couponId -role").populate("subscriptionId")
    const result = await User.find({ subscriptionId: { $ne: null } })
      .select("-password -couponId -role")
      .populate("subscriptionId");
    if (result) {
      return res.status(200).json({
        success: true,
        msg: "User subscriptions fetched successfully",
        result,
      });
    }
    return res.status(404).json({ success: false, msg: "No users found" });
  } catch (error) {
    console.error("Error on getUserSubscription: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getSubscriptionHistoryByUserId = async (req, res) => {
  const id = req.params?.id;
  try {
    const checkUser = await User.findById(id);
    if (!checkUser) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }
    const result = await SubscribeHistory.find({ userId: id }).populate(
      "subscriptionId"
    );
    if (result) {
      return res.status(200).json({
        success: true,
        msg: "User subscription history fetched successfully",
        result,
      });
    }
    return res
      .status(404)
      .json({ success: false, msg: "No subscription history found" });
  } catch (error) {
    console.error("Error on getSubscriptionHistoryByUserId: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.changeStatusSubscriptionHistory = async (req, res) => {
  const userId = req.body?.userId;
  const subscriptionHistoryId = req.body?.subscription;
  const changeStatus = req.body?.changeStatus;
  try {
    const checkUser = await User.findById(userId);
    if (!checkUser) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }
    const checkSubscriptionHistory = await SubscribeHistory.findById(
      subscriptionHistoryId
    );
    if (!checkSubscriptionHistory) {
      return res
        .status(404)
        .json({ success: false, msg: "Subscription history not found" });
    }
    if (changeStatus == "active") {
      checkUser.isActive = true;
      checkUser.subscriptionId = checkSubscriptionHistory._id;
    } else {
      checkUser.isActive = false;
      checkUser.subscriptionId = null;
    }
    checkSubscriptionHistory.status = changeStatus;
    await checkUser.save();
    const result = await checkSubscriptionHistory.save();
    if (result) {
      return res.status(200).json({
        success: true,
        msg: "Subscription status updated successfully",
        result,
      });
    }
    return res
      .status(400)
      .json({ success: false, msg: "Failed to update subscription status" });
  } catch (error) {
    console.error("Error on changeStatusSubscriptionHistory: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.adminChangeUserSubscriptionHistory = async (req, res) => {
  const id = req.params?.id;
  const changeStatus = req.body.isActive;
  try {
    const checkSubscriptionHistory = await SubscribeHistory.findById(id);
    const checkUser = await User.findById(checkSubscriptionHistory.userId);
    if (!checkUser) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }
    if (!checkSubscriptionHistory) {
      return res
        .status(404)
        .json({ success: false, msg: "Subscription history not found" });
    }
    if (changeStatus) checkSubscriptionHistory.status = changeStatus;
    if (changeStatus == "inactive") {
      checkUser.isSubscribed = false;
    } else {
      checkUser.isSubscribed = true;
    }
    const result = await checkSubscriptionHistory.save();
    await checkUser.save();

    if (result) {
      return res.status(200).json({
        success: true,
        msg: `Subscription status updated successfully`,
        result,
      });
    }
    return res
      .status(400)
      .json({ success: false, msg: "Failed to update subscription status" });
  } catch (error) {
    console.error("Error on adminChangeUserSubscriptionHistory: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.userSubscriptionHistory = async (req, res) => {
  const id = req.params?.id;
  try {
    let checkUser = null;
    if (id) {
      checkUser = await User.findById(id)
        .select("-password -couponId -role")
        .populate("trade");
      if (!checkUser) {
        return res.status(404).json({ success: false, msg: "User not found" });
      }
    }
    const filter = {};
    if (req.payload?.role === "admin") {
      if (id) filter.userId = id;
    } else {
      filter.userId = req.payload?._id;
    }
    console.log(req.payload.role, filter, "filllllllllllllll");
    const result = await SubscribeHistory.find(filter)
      .sort({ createdAt: -1 })
      .populate("subscriptionId");
    if (result) {
      return res.status(200).json({
        success: true,
        msg: "User subscription history fetched successfully",
        result,
        user: checkUser ? checkUser : null,
      });
    }
    return res
      .status(404)
      .json({ success: false, msg: "No subscription history found" });
  } catch (error) {
    console.error("Error on userSubscriptionHistory: ", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};
