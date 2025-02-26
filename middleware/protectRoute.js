const jwt = require('jsonwebtoken');
const User = require('../model/User');
require("dotenv").config()

const protectRoute = async (req, res, next) => {
    // const token = req.cookies.jwt
    let token = req.headers['authorization']

    try {
        if (!token) {
            return res.status(401).json({ message: "Unauthorized", success: false });
        }

        let splitToken = token.split(" ")[1]
        const decoded = jwt.verify(splitToken, process.env.SECRET_KEY);
        if (!decoded) {
            return res.status(401).json({ message: "Invalid token", success: false });
        }
        // console.log("token: ", decoded);

        const result = await User.findById(decoded._id).select('-password')
        if (!result) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        req.user = result
        next()
    } catch (error) {
        console.log("error on protectRoute: ", error);
        return res.status(500).json({ message: error.message, error: error, success: false });
    }
}

module.exports = protectRoute;