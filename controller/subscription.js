const SubscribeHistory = require("../model/SubscribeHistory");
const Subscription = require("../model/Subscription");
const User = require("../model/User");

exports.getSubscriptions = async (req, res) => {
    const id = req.params?.id
    try {
        if (id) {
            const subscription = await Subscription.findById(id).populate("trade")
            if (!subscription) {
                return res.status(404).json({ success: false, msg: "Subscription not found" });
            }
            return res.status(200).json({ success: true, msg: "Subscription found", result: subscription });
        }
        const subscriptions = await Subscription.find().sort({ createdAt: -1 }).populate("trade")
        if (!subscriptions) {
            return res.status(404).json({ success: false, msg: "No subscriptions found" });
        }
        return res.status(200).json({ success: true, msg: "Subscriptions found", result: subscriptions });
    } catch (error) {
        console.error("Error on getSubscriptions: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}

exports.getActiveSubscriptions = async (req, res) => {
    try {
        const result = await Subscription.find({ isActive: true }).sort({ createdAt: -1 }).populate("trade")
        if (!result) {
            return res.status(404).json({ success: false, msg: "No active subscriptions found" });
        }
        return res.status(200).json({ success: true, msg: "Active subscriptions found", result });
    } catch (error) {
        console.error("Error on getActiveSubscriptions: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}

exports.addSubscription = async (req, res) => {
    const name = req.body?.name
    const amount = req.body?.amount
    const description = req.body?.description
    const duration = req.body?.duration
    const trade = req.body?.trade
    try {

        const result = await Subscription.create({ name, amount, description, duration, trade })
        if (result) {
            return res.status(201).json({ success: true, msg: "Subscription added successfully", result });
        }
        return res.status(400).json({ success: false, msg: "Failed to add subscription" });
    } catch (error) {
        console.error("Error on addSubscription: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}

exports.updateSubscription = async (req, res) => {
    const id = req.params?.id

    const name = req.body?.name
    const amount = req.body?.amount
    const description = req.body?.description
    const duration = req.body?.duration
    const trade = req.body?.trade

    try {
        const checkSubscription = await Subscription.findById(id)
        if (!checkSubscription) {
            return res.status(404).json({ success: false, msg: "Subscription not found" });
        }
        if (name) checkSubscription.name = name
        if (amount) checkSubscription.amount = amount
        if (description) checkSubscription.description = description
        if (duration) checkSubscription.duration = duration
        if (trade) checkSubscription.trade = trade
        const result = await checkSubscription.save()
        if (result) {
            return res.status(200).json({ success: true, msg: "Subscription updated successfully", result });
        }
        return res.status(400).json({ success: false, msg: "Failed to update subscription" });
    } catch (error) {
        console.error("Error on updateSubscription: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}

exports.deleteSbuscription = async (req, res) => {
    const id = req.params?.id
    try {
        const checkSubscription = await Subscription.findById(id)
        if (!checkSubscription) {
            return res.status(404).json({ success: false, msg: "Subscription not found" });
        }
        const result = await Subscription.findByIdAndDelete(id)
        if (result) {
            return res.status(200).json({ success: true, msg: "Subscription deleted successfully" });
        }
        return res.status(400).json({ success: false, msg: "Failed to delete subscription" });
    } catch (error) {
        console.error("Error on addSubscription: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}


exports.changeStatus = async (req, res) => {
    const id = req.params?.id
    const isActive = req.body?.isActive
    try {
        const checkSubscription = await Subscription.findById(id)

        if (!checkSubscription) {
            return res.status(404).json({ success: false, msg: "Subscription not found" });
        }
        checkSubscription.isActive = isActive
        const result = await checkSubscription.save()
        if (result) {
            return res.status(200).json({ success: true, msg: "Subscription status updated successfully", result });
        }
        return res.status(400).json({ success: false, msg: "Failed to update subscription status" });
    } catch (error) {
        console.error("Error on changeStatus: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}

// ======================================== vendor ===================================

exports.applySubscription = async (req, res) => {
    const id = req.params?.id; //here will be subscription id
    const userId = req.payload?._id
    // console.log("================================== applySubscription ==================================");
    // console.log("id: ", id);

    try {
        const checkSubscription = await Subscription.findById(id)
        if (!checkSubscription) {
            return res.status(404).json({ success: false, msg: "Subscription not found" });
        }
        const checkUser = await User.findById(userId)
        if (!checkUser) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }
        if (checkUser.isApproved == false) {
            return res.status(403).json({ success: false, msg: "User is not approved" });
        }
        if (checkUser.isSubscribed == true) {
            return res.status(400).json({ success: false, msg: "Subscription is already taken." });
        }

        const activeSubscription = await SubscribeHistory.findOne({
            _id: checkUser?.subscriptionId,
            // status: 'active',
            endDate: { $gt: new Date() } // Check if the subscription is still valid
        });
        if (activeSubscription) {
            return res.status(400).json({ success: false, msg: `Subscription is already taken. Please contact to admin.` });
        }
        // const subscriptionDate = new Date();
        // const expirationDate = new Date(subscriptionDate.getTime() + checkSubscription.duration * 24 * 60 * 60 * 1000);
        const subscriptionDate = new Date(); // Current date
        const expirationDate = new Date(subscriptionDate); // Copy current date

        // Add months based on the subscription duration
        expirationDate.setMonth(expirationDate.getMonth() + checkSubscription.duration);

        checkUser.isSubscribed = true;


        const result = await SubscribeHistory.create({ userId, subscriptionId: id, endDate: expirationDate, duration: checkSubscription.duration, amount: checkSubscription?.amount })
        checkUser.subscriptionId = result?._id
        if (result) {
            await checkUser.save()
            return res.status(200).json({ success: true, msg: "Subscription applied successfully", result });
        }
        return res.status(400).json({ success: false, msg: "Failed to apply subscription" });

    } catch (error) {
        console.error("Error on applySubscription: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}


exports.getUserSubscription = async (req, res) => {

    try {
        // const result = await User.find().select("-password -couponId -role").populate("subscriptionId")
        const result = await User.find({ subscriptionId: { $ne: null } }).select("-password -couponId -role").populate("subscriptionId");
        if (result) {
            return res.status(200).json({ success: true, msg: "User subscriptions fetched successfully", result });
        }
        return res.status(404).json({ success: false, msg: "No users found" });
    } catch (error) {
        console.error("Error on getUserSubscription: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}


exports.getSubscriptionHistoryByUserId = async (req, res) => {
    const id = req.params?.id
    try {
        const checkUser = await User.findById(id)
        if (!checkUser) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }
        const result = await SubscribeHistory.find({ userId: id }).populate("subscriptionId")
        if (result) {
            return res.status(200).json({ success: true, msg: "User subscription history fetched successfully", result });
        }
        return res.status(404).json({ success: false, msg: "No subscription history found" });
    } catch (error) {
        console.error("Error on getSubscriptionHistoryByUserId: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}


exports.changeStatusSubscriptionHistory = async (req, res) => {
    const userId = req.body?.userId
    const subscriptionHistoryId = req.body?.subscription
    const changeStatus = req.body?.changeStatus
    try {
        const checkUser = await User.findById(userId)
        if (!checkUser) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }
        const checkSubscriptionHistory = await SubscribeHistory.findById(subscriptionHistoryId)
        if (!checkSubscriptionHistory) {
            return res.status(404).json({ success: false, msg: "Subscription history not found" });
        }
        if (changeStatus == "active") {
            checkUser.isActive = true
            checkUser.subscriptionId = checkSubscriptionHistory._id
        } else {
            checkUser.isActive = false
            checkUser.subscriptionId = null
        }
        checkSubscriptionHistory.status = changeStatus

        await checkUser.save()

        const result = await checkSubscriptionHistory.save()
        if (result) {
            return res.status(200).json({ success: true, msg: "Subscription status updated successfully", result });
        }
        return res.status(400).json({ success: false, msg: "Failed to update subscription status" });
    } catch (error) {
        console.error("Error on changeStatusSubscriptionHistory: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}


exports.adminChangeUserSubscriptionHistory = async (req, res) => {
    const id = req.params?.id;
    const changeStatus = req.body.isActive;

    try {
        const checkSubscriptionHistory = await SubscribeHistory.findById(id)
        const checkUser = await User.findById(checkSubscriptionHistory.userId)

        if (!checkUser) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }

        if (!checkSubscriptionHistory) {
            return res.status(404).json({ success: false, msg: "Subscription history not found" });
        }
        if (changeStatus) checkSubscriptionHistory.status = changeStatus
        if (changeStatus == "inactive") {
            checkUser.isSubscribed = false;
        } else {
            checkUser.isSubscribed = true;
        }
        const result = await checkSubscriptionHistory.save()
        await checkUser.save()

        if (result) {
            return res.status(200).json({ success: true, msg: `Subscription status updated successfully`, result });
        }
        return res.status(400).json({ success: false, msg: "Failed to update subscription status" });
    } catch (error) {
        console.error("Error on adminChangeUserSubscriptionHistory: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}

exports.userSubscriptionHistory = async (req, res) => {
    const id = req.params?.id || req.payload?._id

    try {
        const checkUser = await User.findById(id).select("-password -couponId -role").populate("trade")
        if (!checkUser) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }
        const result = await SubscribeHistory.find({ userId: id }).sort({ createdAt: -1 }).populate("subscriptionId")
        if (result) {
            return res.status(200).json({ success: true, msg: "User subscription history fetched successfully", result, user: checkUser });
        }
        return res.status(404).json({ success: false, msg: "No subscription history found" });
    } catch (error) {
        console.error("Error on userSubscriptionHistory: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}