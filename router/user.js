const express = require('express');
const { registrationValidation, loginValidation } = require('../middleware/userValidation');
const { verifyToken } = require('../middleware/authValidation');
const { registorUser, loginUser, userUpdate, userProfile, uploadProfileImage, getAllUserByTrad, getAllUsers, getAllUserForChat, changeStatusUser, singleUser, dashboardDetails } = require('../controller/user');
const userRouter = express.Router();

// userRouter.get('')

userRouter.get('/dashboard', verifyToken, dashboardDetails)

userRouter.post('/register', registrationValidation, registorUser)

userRouter.post('/login', loginValidation, loginUser)

userRouter.get('/profile', verifyToken, userProfile)

userRouter.get('/getAll', getAllUsers)

userRouter.get('/trade/:id', getAllUserByTrad)
// userRouter.get('/profile/:id', verifyToken, userProfile)

userRouter.put('/imageUpdate', verifyToken, uploadProfileImage) // update all fields for current user

// userRouter.put('/profile/:id', verifyToken, userUpdate)
userRouter.put('/profile', verifyToken, userUpdate)

userRouter.get('/chat/users', verifyToken, getAllUserForChat)

userRouter.put('/approve/user/:id', verifyToken, changeStatusUser)

userRouter.get('/userProfile/:id', verifyToken, singleUser)

module.exports = userRouter