const admin = require("firebase-admin");
const User = require("../model/User");
const Notification = require("../model/Notification");
const serviceAccount = require("../firebaseSecretKeys.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

exports.sendMultipleNotification = async (
  title,
  description,
  action,
  targetType,
  userId,
) => {
  try {
    const normalizedUserIds = Array.isArray(userId)
      ? userId
      : userId
        ? [userId]
        : [];

    const debugMeta = {
      title: String(title ?? ""),
      description: String(description ?? ""),
      action: String(action ?? ""),
      targetType: String(targetType ?? ""),
      userIdType: Array.isArray(userId) ? "array" : typeof userId,
      userIdCount: normalizedUserIds.length,
    };
    console.log("🔔 sendMultipleNotification called:", debugMeta);

    if (normalizedUserIds.length === 0) {
      console.log("No userIds provided to sendMultipleNotification");
      return "No users found";
    }

    const users = await User.find({
      _id: { $in: normalizedUserIds },
      role: { $ne: "admin" },
    });
    if (!users.length) {
      console.log("No users found");
      return "No users found";
    }

    const tokenDiagnostics = users.map((u) => ({
      userId: String(u._id),
      hasToken: Boolean(u.fcmToken),
      tokenLength: u.fcmToken ? String(u.fcmToken).trim().length : 0,
    }));

    const fcmTokens = [
      ...new Set(
        users.map((u) => u.fcmToken?.trim()).filter((t) => t && t.length >= 20),
      ),
    ];
    if (fcmTokens.length === 0) {
      console.log("No valid FCM tokens found", { tokenDiagnostics });
      return "No valid FCM tokens found";
    }
    console.log("📤 Sending multicast to", fcmTokens.length, "devices");

    const messageC = {
      notification: {
        title: String(title ?? ""),
        body: String(description ?? ""),
      },
      data: {
        type: String(action ?? "general"),
        title: String(title ?? ""),
        body: String(description ?? ""),
        targetType: String(targetType ?? ""),
      },
      android: {
        priority: "high",
        notification: {
          channelId: "default",
          sound: "default",
        },
      },
      tokens: fcmTokens,
    };

    console.log("📦 Multicast payload:", {
      hasNotification: Boolean(messageC.notification),
      data: messageC.data,
      tokenCount: messageC.tokens.length,
    });

    const response = await admin.messaging().sendEachForMulticast(messageC);

    console.log("📊 Multicast result:", {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    const tokenToUserId = new Map(
      users
        .filter((u) => u.fcmToken)
        .map((u) => [u.fcmToken.trim(), String(u._id)]),
    );

    const notificationsToInsert = [];

    for (let i = 0; i < response.responses.length; i++) {
      const r = response.responses[i];
      const token = fcmTokens[i];
      const mappedUserId = tokenToUserId.get(token);

      if (!r.success) {
        console.error("❌ FCM send failed:", {
          index: i,
          tokenPreview: token ? token.slice(0, 12) + "..." : null,
          code: r.error?.code,
          message: r.error?.message,
        });

        if (
          r.error?.code === "messaging/registration-token-not-registered" ||
          r.error?.code === "messaging/invalid-registration-token"
        ) {
          await User.updateOne(
            { fcmToken: token },
            { $unset: { fcmToken: "" } },
          );
          console.log("🧹 Removed invalid token from user record");
        }
      }

      notificationsToInsert.push({
        userId: mappedUserId,
        title,
        message: description,
        targetType,
        action,
        status: r.success ? "SENT" : "FAILED",
      });
    }

    await Notification.insertMany(notificationsToInsert);

    console.log("✅ Bulk notification process completed");
    return response;
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
