const admin = require('firebase-admin')
const serviceAccount = require('../ricedeal-2fb8e-firebase-adminsdk.json')
const Notification = require('../model/Notification')
const User = require('../model/User')
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})


exports.sendSingleNotification = async (title, description, userId, fcmToken, action, targetType) => {
    const messageC = {
        notification: {
            title: title,
            body: description,
            image: image ? image : '',
        },
        data: {
            type: action
        },
        token: fcmToken
    }
    try {
        console.log("try side");

        if (!fcmToken) {
            return "User not login yet once!"
        }


        const result = await Notification.create({ userId, title, message: description, targetType, action })

        if (result) {
            admin.messaging().send(messageC).then(async (response) => {
                console.log("response admin.messaging: ", response);
            }).catch((err) => {
                console.log("err: error on sending message", err);
                return err
            })
        } else {
            return 'Failed to creaet notificatoin in table!'
        }
    } catch (error) {
        console.log("error on sendMessage: ", error);
        return error.message
    }
}

exports.sendMultipleNotification = async (title, description, action, targetType, userId) => {
    try {
        // Fetch users whose _id is in userIds and exclude those with role "admin"
        const users = await User.find({ _id: { $in: userId }, role: { $ne: "admin" } });

        // Extract valid FCM tokens
        const fcmTokens = users.map(user => user.fcmToken).filter(token => token);

        if (fcmTokens.length === 0) {
            console.log("No valid FCM tokens found");
            return "No valid FCM tokens found";
        }

        const messageC = {
            notification: {
                title: title,
                body: description,
            },
            data: {
                type: action
            },
            tokens: fcmTokens
        };

        // Save notifications in the database
        const notifications = users.map(user => ({
            userId: user._id,
            title,
            message: description,
            targetType,
            action
        }));
        await Notification.insertMany(notifications);

        // Send the notification to multiple users
        const response = await admin.messaging().sendEachForMulticast(messageC);

        console.log("Bulk notification sent:", response);
        return response;

    } catch (error) {
        console.error("Error on sendMultipleNotification:", error);
        return error.message;
    }
};
