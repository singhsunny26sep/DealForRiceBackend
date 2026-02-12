const admin = require("firebase-admin");
const User = require("../model/User");
const Notification = require("../model/Notification");
const serviceAccount = require("../firebaseSecretKeys.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// exports.sendMultipleNotification = async (
//   title,
//   description,
//   action,
//   targetType,
//   userId,
// ) => {
//   try {
//     const users = await User.find({
//       _id: { $in: userId },
//       role: { $ne: "admin" },
//     });
//     const fcmTokens = users
//       .map((user) => user.fcmToken)
//       .filter((token) => token);
//     if (fcmTokens.length === 0) {
//       console.log("No valid FCM tokens found");
//       return "No valid FCM tokens found";
//     }
//     const messageC = {
//       data: {
//         type: action,
//         title: title,
//         body: description,
//       },
//       tokens: fcmTokens,
//     };
//     const response = await admin.messaging().sendEachForMulticast(messageC);
//     const notifications = users.map((user, index) => ({
//       userId: user._id,
//       title,
//       message: description,
//       targetType,
//       action,
//       status: response.responses[index]?.success ? "SENT" : "FAILED",
//     }));
//     await Notification.insertMany(notifications);
//     console.log("Bulk notification sent:", response);
//     return response;
//   } catch (error) {
//     console.error("Error on sendMultipleNotification:", error);
//     return error.message;
//   }
// };

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
    if (!users.length) {
      console.log("No users found");
      return "No users found";
    }
    const fcmTokens = [
      ...new Set(
        users.map((u) => u.fcmToken?.trim()).filter((t) => t && t.length > 100),
      ),
    ];
    if (fcmTokens.length === 0) {
      console.log("No valid FCM tokens found");
      return "No valid FCM tokens found";
    }
    console.log("📤 Sending multicast to", fcmTokens.length, "devices");
    // const messageC = {
    //   notification: {
    //     title: String(title),
    //     body: String(description),
    //   },
    //   data: {
    //     type: String(action),
    //     title: String(title),
    //     body: String(description),
    //     targetType: String(targetType ?? ""),
    //   },
    //   android: {
    //     priority: "high",
    //   },
    //   tokens: fcmTokens,
    // };
    // const response = await admin.messaging().sendEachForMulticast(messageC);
    for (const token of fcmTokens) {
      const message = {
        token: token,
        notification: {
          title: String(title),
          body: String(description),
        },
        data: {
          type: String(action),
          title: String(title),
          body: String(description),
          targetType: String(targetType ?? ""),
        },
        android: {
          priority: "high",
        },
      };
      const response = await admin.messaging().send(message);
      console.log("📤 Sent to token:", token, "Response:", response);
      // console.log("📊 Multicast result:", {
      //   successCount: response.successCount,
      //   failureCount: response.failureCount,
      // });

      // response.responses.forEach(async (resp, index) => {
      //   if (!resp.success) {
      //     console.error("❌ FCM error:", resp.error?.code, resp.error?.message);
      //     if (
      //       resp.error?.code === "messaging/registration-token-not-registered" ||
      //       resp.error?.code === "messaging/invalid-registration-token"
      //     ) {
      //       await User.updateOne(
      //         { fcmToken: fcmTokens[index] },
      //         { $unset: { fcmToken: "" } },
      //       );
      //       console.log("🧹 Removed invalid token");
      //     }
      //   }
      // });
      // const notifications = users.map((user) => ({
      //   userId: user._id,
      //   title,
      //   message: description,
      //   targetType,
      //   action,
      //   status: fcmTokens.includes(user.fcmToken) ? "SENT" : "FAILED",
      // }));
      // await Notification.insertMany(notifications);
      const notificationRecord = new Notification({
        userId: users.find((u) => u.fcmToken === token)?._id,
        title,
        message: description,
        targetType,
        action,
        status: "SENT",
      });
      await notificationRecord.save();
    }
    console.log("✅ Bulk notification process completed");
    return "Bulk notification process completed";
  } catch (error) {
    console.error("🔥 Error on sendMultipleNotification:", error);
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
