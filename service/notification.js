const admin = require("firebase-admin");
const User = require("../model/User");
const Notification = require("../model/Notification");
const serviceAccount = require("../firebaseSecretKeys.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.sendMultipleNotification = async (
  title,
  description,
  action,
  targetType,
  userId,
) => {
  try {
    const users = await User.find({
      _id: { $in: userId },
      role: { $ne: "admin" },
    });
    const fcmTokens = users
      .map((user) => user.fcmToken)
      .filter((token) => token);
    if (fcmTokens.length === 0) {
      console.log("No valid FCM tokens found");
      return "No valid FCM tokens found";
    }
    const messageC = {
      data: {
        type: action,
        title:title, 
        body:description, 
      },
      tokens: fcmTokens,
    };
    const response = await admin.messaging().sendEachForMulticast(messageC);
    const notifications = users.map((user, index) => ({
      userId: user._id,
      title,
      message: description,
      targetType,
      action,
      status: response.responses[index]?.success ? "SENT" : "FAILED",
    }));
    await Notification.insertMany(notifications);
    console.log("Bulk notification sent:", response);
    return response;
  } catch (error) {
    console.error("Error on sendMultipleNotification:", error);
    return error.message;
  }
};

exports.sendPushNotification = async (userId, { title, body, senderId }) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.fcmToken) return;
    const message = {
      token: user.fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        senderId: String(senderId),
      },
      android: {
        priority: "high",
      },
    };
    await admin.messaging().send(message);
    console.log("Push Notification Sent:", userId);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

