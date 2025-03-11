const Notification = require("../model/Notification");


exports.getNotification = async (req, res) => {
    const id = req.params?.id
    try {
        const result = await Notification.find({ userId: id }).sort({ createdAt: -1 })
        if (result) {
            return res.status(200).json({ success: true, result })
        }
        return res.status(404).json({ success: false, msg: "No notifications found" });
    } catch (error) {
        console.log("error on getNotification: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}


exports.sendTestNotification = async (req, res) => {
    const msg = req.body?.msg
    try {

    } catch (error) {
        console.log("error on sendTestNotification: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}