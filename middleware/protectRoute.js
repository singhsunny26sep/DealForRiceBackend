const jwt = require('jsonwebtoken');
const User = require('../model/User');

const protectRoute = async (req, res, next) => {
    // const token = req.cookies.jwt
    let token = req.headers['authorization']
    // console.log("token: ", token);

    try {
        if (!token) {
            return res.status(401).json({ message: "Unauthorized", success: false });
        }

        let splitToken = token.split(" ")[1]
        // console.log("split token: ", splitToken);

        const decoded = jwt.verify(splitToken, process.env.SECRET);
        if (!decoded) {
            return res.status(401).json({ message: "Invalid token", success: false });
        }
        // console.log("token: ", decoded);

        const result = await User.findById(decoded.userId).select('-password')
        if (!result) {
            return res.status(404).json({ message: "User not found", success: false });
        }
        // console.log("result: ", result);

        req.user = result
        next()
    } catch (error) {
        console.log("error on protectRoute: ", error);
        return res.status(500).json({ message: error.message, error: error, success: false });
    }
}

module.exports = protectRoute;