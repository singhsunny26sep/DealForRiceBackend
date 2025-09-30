const cron = require("node-cron");
const User = require("../model/User");
const SubscribeHistory = require("../model/SubscribeHistory");

function startSubscriptionCron() {
  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ Running subscription expiry cron at", new Date());
    try {
      const result = await SubscribeHistory.updateMany(
        {
          endDate: { $lt: new Date() },
          status: "active",
        },
        {
          $set: {
            status: "inactive",
            updatedAt: new Date(),
          },
        }
      );
      console.log(`✅ Subscriptions expired: ${result.modifiedCount}`);
      const expiredSubs = await SubscribeHistory.find({
        endDate: { $lt: new Date() },
        status: "inactive",
      }).select("userId");
      if (expiredSubs.length > 0) {
        const userIds = expiredSubs.map((s) => s.userId);
        await User.updateMany(
          { _id: { $in: userIds } },
          {
            $set: {
              isSubscribed: false,
              subscriptionId: null,
            },
          }
        );
        console.log(`✅ Users updated: ${userIds.length}`);
      }
    } catch (err) {
      console.error("❌ Error in subscription expiry cron:", err);
    }
  });
}

module.exports = startSubscriptionCron;
