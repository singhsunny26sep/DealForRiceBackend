const express = require("express");
const subscribeRouter = express.Router();

const { verifyToken } = require("../middleware/authValidation");
const {
  getSubscriptions,
  getActiveSubscriptions,
  addSubscription,
  updateSubscription,
  changeStatus,
  deleteSbuscription,
  applySubscription,
  getUserSubscription,
  adminChangeUserSubscriptionHistory,
  userSubscriptionHistory,
  subscriptionListWithUser,
  createOrderSubscription,
} = require("../controller/subscription");

subscribeRouter.get("/", getSubscriptions);
subscribeRouter.get("/:id", getSubscriptions);
subscribeRouter.get("/users/subscriptionList", getActiveSubscriptions);
subscribeRouter.get(
  "/subscription/list",
  verifyToken,
  subscriptionListWithUser
);
subscribeRouter.post("/", verifyToken, addSubscription);
subscribeRouter.put("/:id", verifyToken, updateSubscription);
subscribeRouter.put("/changeStatus/:id", verifyToken, changeStatus);
subscribeRouter.delete("/:id", verifyToken, deleteSbuscription);
subscribeRouter.post(
  "/generateOrder/subscription/:id",
  verifyToken,
  createOrderSubscription
);
subscribeRouter.post("/apply/subscrition/:id", verifyToken, applySubscription);
subscribeRouter.put(
  "/change/user/subscription/:id",
  verifyToken,
  adminChangeUserSubscriptionHistory
);
subscribeRouter.get(
  "/history/user/subscription/:id",
  verifyToken,
  userSubscriptionHistory
);
subscribeRouter.get(
  "/history/user/subscription",
  verifyToken,
  userSubscriptionHistory
);

module.exports = subscribeRouter;
