const jwt = require('jsonwebtoken');
const User = require('../model/User');
require('dotenv').config()

const secret = process.env.SECRET_KEY;

exports.generateToken = async (checkUser) => {
    const token = jwt.sign({ _id: checkUser?._id, name: checkUser?.name, email: checkUser?.email, mobile: checkUser?.mobile, address: checkUser?.address, role: checkUser?.role }, process.env.SECRET_KEY, { expiresIn: '7d' })
    return token
}


exports.verifyToken = async (req, res, next) => {
    let token = req.headers['authorization']
    // console.log("token: ", token);
    try {
        if (!token) {
            // console.log("token: ", token);
            return res.status(401).json({ msg: 'Access Denied!', success: false })
        }

        let splitToken = token.split(" ")[1]
        if (!splitToken) {
            // console.log("split token: ", splitToken);

            // console.log("this come here", splitToken);
            return res.status(401).json({ msg: 'Access Denied!', success: false })
        }
        const decodedToken = jwt.verify(splitToken, secret);
        // const decodedToken = jwt.verify(token, secret);
        // console.log("decoded token: ", decodedToken);

        if (!decodedToken) {
            return res.status(401).json({ msg: 'Access Denied!', success: false })
        }

        // const checkUser = await User.findOne({ where: { id: decodedToken.result.id } })
        const checkUser = await User.findById(decodedToken?._id)
        // console.log("checkUser", checkUser);

        if (checkUser) {
            req.payload = checkUser
            next()
        } else {
            return res.status(401).json({ msg: 'Access Denied!', success: false })
        }
    } catch (error) {
        console.log("error on auth: ", error);
        return res.status(500).json({ err: error.message, error, success: false })
    }
}