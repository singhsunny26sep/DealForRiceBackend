const express = require('express');
const { registrationValidation, loginValidation } = require('../middleware/userValidation');
const { verifyToken } = require('../middleware/authValidation');
const { registorUser, loginUser, userUpdate, userProfile, uploadProfileImage } = require('../controller/user');
const userRouter = express.Router();

// userRouter.get('')

userRouter.post('/register', registrationValidation, registorUser)

userRouter.post('/login', loginValidation, loginUser)

userRouter.get('/profile', verifyToken, userProfile)
// userRouter.get('/profile/:id', verifyToken, userProfile)

userRouter.put('/imageUpdate', verifyToken, uploadProfileImage) // update all fields for current user

// userRouter.put('/profile/:id', verifyToken, userUpdate)
userRouter.put('/profile', verifyToken, userUpdate)

module.exports = userRouter