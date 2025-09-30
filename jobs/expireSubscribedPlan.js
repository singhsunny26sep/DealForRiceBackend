const cron = require("node-cron");
const User = require("../model/User");
const SubscribeHistory = require("../model/SubscribeHistory");

function startSubscriptionCron() {
  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ Running subscription expiry cron at", new Date());
    try {
      const expiredNow = await SubscribeHistory.find({
        endDate: { $lt: new Date() },
        status: "active",
      }).select("_id userId");
      if (expiredNow.length === 0) {
        console.log("✅ No subscriptions expired this cycle.");
        return;
      }
      const expiredIds = expiredNow.map((s) => s._id);
      const userIds = expiredNow.map((s) => s.userId);
      await SubscribeHistory.updateMany(
        { _id: { $in: expiredIds } },
        {
          $set: {
            status: "inactive",
            updatedAt: new Date(),
          },
        }
      );
      await User.updateMany(
        { _id: { $in: userIds } },
        {
          $set: {
            isSubscribed: false,
            subscriptionId: null,
          },
        }
      );
      console.log(
        `✅ Expired subscriptions: ${expiredIds.length}, Users updated: ${userIds.length}`
      );
    } catch (err) {
      console.error("❌ Error in subscription expiry cron:", err);
    }
  });
}

module.exports = startSubscriptionCron;
