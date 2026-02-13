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
  updateFcmToken,
} = require("../controller/user");

userRouter.get("/subscriptionDetails", verifyToken, checkSubscription);
userRouter.get("/dashboard", verifyToken, dashboardDetails);
userRouter.post("/register", registrationValidation, registorUser); // register user any role
userRouter.post("/login", loginValidation, loginUser); // login with email and password
userRouter.post("/loginWithMobile", loginWithMobile); // login/signup with mobile and send otp
userRouter.post("/loginOrSignInWithEmail", loginOrSignInWithEmail); // login/signup with email and send otp
userRouter.post("/mobileLogin", mobileLogin); // login with mobile and password
userRouter.post("/resetPassword", resetPassword); // reset password with mobile and sent otp
userRouter.post("/verify/otp", verifyOTPAPI); // verify otp with mobile
userRouter.post("/verifyOTPWithEmail", verifyOTPWithEmail); // verify otp with email
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
userRouter.post("/update-fcm-token", verifyToken, updateFcmToken);
userRouter.post("/forgot-password", forgotPassword); // forgot password and send otp in email
userRouter.put("/update-password", verifyToken, updatePassword); // update password after login
userRouter.delete("/delete/:id", verifyToken, deleteUser);

module.exports = userRouter;
