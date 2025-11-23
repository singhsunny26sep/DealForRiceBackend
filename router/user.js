const express = require("express");
const userRouter = express.Router();

const {
  registrationValidation,
  loginValidation,
} = require("../middleware/userValidation");
const { verifyToken } = require("../middleware/authValidation");
const {
  loginOrSignInWithEmail,
  verifyOTPWithEmail,
  registorUser,
  loginUser,
  userUpdate,
  userProfile,
  uploadProfileImage,
  getAllUserByTrad,
  getAllUsers,
  getAllUserForChat,
  changeStatusUser,
  singleUser,
  dashboardDetails,
  loginWithMobile,
  verifyOTPAPI,
  resetPassword,
  mobileLogin,
  checkSubscription,
  completeProfile,
  deleteUser,
  forgotPassword,
  updatePassword,
} = require("../controller/user");

userRouter.get("/subscriptionDetails", verifyToken, checkSubscription);

userRouter.get("/dashboard", verifyToken, dashboardDetails);

userRouter.post("/register", registrationValidation, registorUser);

userRouter.post("/login", loginValidation, loginUser);

userRouter.post("/loginWithMobile", loginWithMobile);

userRouter.post("/loginOrSignInWithEmail", loginOrSignInWithEmail);

userRouter.post("/mobileLogin", mobileLogin);

userRouter.post("/resetPassword", resetPassword);

userRouter.post("/verify/otp", verifyOTPAPI);

userRouter.post("/verifyOTPWithEmail", verifyOTPWithEmail);

userRouter.get("/profile", verifyToken, userProfile);

userRouter.get("/getAll", getAllUsers);

userRouter.get("/trade/:id", getAllUserByTrad);

userRouter.get("/profile/:id", verifyToken, userProfile);

userRouter.put("/imageUpdate", verifyToken, uploadProfileImage);

// userRouter.put('/profile/:id', verifyToken, userUpdate)
userRouter.put("/profile", verifyToken, userUpdate);

userRouter.put("/completeProfile/:id", verifyToken, completeProfile);

userRouter.get("/chat/users", verifyToken, getAllUserForChat);

userRouter.put("/approve/user/:id", verifyToken, changeStatusUser);

userRouter.get("/userProfile/:id", verifyToken, singleUser);

userRouter.delete("/delete/:id", verifyToken, deleteUser);

userRouter.post("/forgot-password", forgotPassword);

userRouter.put("/update-password", verifyToken, updatePassword);

module.exports = userRouter;
