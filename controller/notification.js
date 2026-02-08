const Notification = require("../model/Notification");
const { sendPushNotification } = require("../service/notification");

exports.getNotification = async (req, res) => {
  const id = req.params?.id;
  try {
    const result = await Notification.find({ userId: id }).sort({
      createdAt: -1,
    });
    if (result) {
      return res.status(200).json({ success: true, result });
    }
    return res
      .status(404)
      .json({ success: false, msg: "No notifications found" });
  } catch (error) {
    console.log("error on getNotification: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};

exports.sendTestNotification = async (req, res) => {
  const msg = req.body?.msg;
  const fcmToken = req.body?.fcmToken;
  try {
    await sendPushNotification(
      "67b72a2e3b5e80bd0a6c44dc",
      {
        title: "Test Notification",
        body: msg,
        senderId: "67b72a2e3b5e80bd0a6c44dc",
      },
      fcmToken,
      "notification",
      "Notification",
    );
    console.log(
      " ======================================== notification sent ========================================",
    );
    return res
      .status(200)
      .json({ success: true, msg: "Notification sent successfully" });
  } catch (error) {
    console.log("error on sendTestNotification: ", error);
    return res
      .status(500)
      .json({ error: error, success: false, msg: error.message });
  }
};
