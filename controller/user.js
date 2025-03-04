const { generateToken } = require("../middleware/authValidation");
const User = require("../model/User")
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { deleteFromCloudinary, uploadToCloudinary } = require("../service/uploadImage");
const Conversation = require("../model/Conversation");
const Chat = require("../model/Chat");
const Message = require("../model/Message");
let salt = 10;

exports.userProfile = async (req, res) => {
    const id = req.params?.id || req.payload?._id
    try {
        if (!id) {
            return res.status(400).json({ error: "User not found", success: false, msg: "User not found" })
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid trade ID", success: false, msg: "Invalid trade ID" });
        }
        const user = await User.findById(id).populate("trade").populate({ path: "subscriptionId", populate: { path: "subscriptionId", select: "-isActive -__V" } })
        if (!user) {
            return res.status(404).json({ error: "User not found", success: false, msg: "User not found" })
        }
        return res.status(200).json({ success: true, result: user })
    } catch (error) {
        console.log("error on userProfile: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}

exports.singleUser = async (req, res) => {
    const id = req.params?.id
    try {
        if (!id) {
            return res.status(400).json({ error: "User not found", success: false, msg: "User not found" })
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid trade ID", success: false, msg: "Invalid trade ID" });
        }
        const user = await User.findById(id).populate("trade")
        if (!user) {
            return res.status(404).json({ error: "User not found", success: false, msg: "User not found" })
        }
        return res.status(200).json({ success: true, result: user })
    } catch (error) {
        console.log("error on userProfile: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}

exports.getAllUserByTrad = async (req, res) => {
    const id = req.params?.id //trade id
    try {
        const result = await User.find({ trade: id }).select("-password -role").sort({ createdAt: -1 }).populate("trade")
        if (result) {
            return res.status(200).json({ success: true, result })
        }
        return res.status(404).json({ success: false, msg: "No users found" });
    } catch (error) {
        console.log("error on getAllUserByTrad: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}

exports.registorUser = async (req, res) => {

    const name = req.body?.name
    const email = req.body?.email
    const mobile = req.body?.mobile
    const password = req.body?.password
    const trade = req.body?.trade
    const city = req.body?.city
    const state = req.body?.state
    const image = req.files?.image

    try {
        const checkUser = await User.findOne({ email })
        if (checkUser) {
            return res.status(400).json({ error: "Email already exists", success: false, msg: "Email already exists" })
        }
        const hashedPass = await bcrypt.hash(password, parseInt(salt));
        if (!hashedPass) {
            return res.status(400).json({ success: false, msg: "Failed to register!" });
        }

        /* if (role) {
            if (role === "admin") {
                return res.status(400).json({ success: false, msg: "Admin role is not allowed" });
            }
        } */

        const user = new User({ name, email, mobile, password: hashedPass })
        if (mongoose.Types.ObjectId.isValid(trade)) {
            user.trade = trade
        }
        if (city) user.city = city
        if (state) user.state = state

        if (image) {
            let imageUrl = await uploadToCloudinary(image.tempFilePath)
            user.image = imageUrl
        }
        const result = await user.save()
        if (result) {
            const token = await generateToken(result)
            return res.status(200).json({ success: true, msg: `User registered successfully`, result, token })
        }
        return res.status(400).json({ error: "Failed to register user", success: false, msg: "Failed to register user" })
    } catch (error) {
        console.log("error on registorUser: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}


exports.loginUser = async (req, res) => {
    const email = req.body?.email
    const password = req.body?.password
    try {
        const checkUser = await User.findOne({ email: email })
        if (!checkUser) {
            return res.status(401).json({ error: "Invalid credentials", success: false, msg: "User not found" })
        }

        if (checkUser.isActive == false) {
            return res.status(401).json({ success: false, msg: "Account is not active. Please contact with admin." })
        }
        const matchedPass = await bcrypt.compare(password, checkUser.password);
        if (!matchedPass) {
            return res.status(401).json({ success: false, msg: "Invalid credentials" })
        }
        const token = await generateToken(checkUser)
        return res.status(200).json({ success: true, msg: "User logged in successfully", token })
    } catch (error) {
        console.log("error on loginUser: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}

exports.uploadProfileImage = async (req, res) => {
    const id = req.payload._id //user id
    const image = req.files?.image


    try {
        const checkUser = await User.findById(id)
        if (!checkUser) {
            return res.status(400).json({ success: false, msg: 'User not found!' })
        }
        if (checkUser.image) {
            await deleteFromCloudinary(checkUser?.image)
        }
        let imageUrl = await uploadToCloudinary(image.tempFilePath)

        checkUser.image = imageUrl
        const result = await checkUser.save()
        if (result) {
            return res.status(200).json({ success: true, msg: 'Profile image updated successfully', data: result })
        }
        return res.status(400).json({ success: false, msg: 'Failed to update profile image!' })
    } catch (error) {
        console.log("error on uploadProfileImage: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}

exports.userUpdate = async (req, res) => {

    const id = req.payload._id //user id
    const name = req.body?.name
    const email = req.body?.email
    const mobile = req.body?.mobile
    const address = req.body?.address
    const trade = req.body?.trade
    const city = req.body?.city
    const state = req.body?.state
    try {
        const checkUser = await User.findById(id)
        if (!checkUser) {
            return res.status(400).json({ success: false, msg: 'User not found!' })
        }
        if (name) checkUser.name = name
        if (email) checkUser.email = email
        if (mobile) checkUser.mobile = mobile
        if (address) checkUser.address = address
        if (trade) checkUser.trade = trade
        if (city) checkUser.city = city
        if (state) checkUser.state = state

        const result = await checkUser.save()
        if (result) {
            return res.status(200).json({ success: true, msg: 'User updated successfully', data: result })
        }
        return res.status(400).json({ success: false, msg: 'Failed to update user!' })
    } catch (error) {
        console.log("error on userUpdate: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}


exports.getAllUsers = async (req, res) => {

    try {
        const result = await User.find({ role: "user" }).sort({ createdAt: -1 }).select("-password -role -__v")
        if (result) {
            return res.status(200).json({ success: true, result })
        }
        return res.status(404).json({ success: false, msg: "No users found" });
    } catch (error) {
        console.log("error on getAllUsers: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}


/* exports.getAllUserForChat = async (req, res) => {
    const id = req.payload?._id //user id

    try {
        const result = await User.find({ role: "user", _id: { $ne: id } }).sort({ createdAt: -1 }).select("-password -role -__v").populate("trade")

        if (result) {
            return res.status(200).json({ success: true, result });
        }
        return res.status(404).json({ success: false, msg: "No users found" });
    } catch (error) {
        console.log("error on getAllUsers: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
} */

/* exports.getAllUserForChat = async (req, res) => {
    const userId = req.payload?._id; // Current user ID

    try {
        const users = await User.find({ role: "user", _id: { $ne: userId } }).select("-password -role -__v").populate("trade");

        // Get latest message timestamp for each user
        const usersWithLastMessage = await Promise.all(users.map(async (user) => {
            const conversation = await Conversation.findOne({ participants: { $all: [userId, user._id] } }).sort({ updatedAt: -1 }).populate("lastMessage")

            return {
                ...user.toObject(),
                lastMessageTime: conversation?.lastMessage ? conversation.updatedAt : new Date(0), // If no conversation, default to old date
                lastMessage: conversation?.lastMessage ? conversation?.lastMessage?.message : ''
            };
        }));

        // Sort by latest message time (descending order)
        usersWithLastMessage.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

        return res.status(200).json({ success: true, result: usersWithLastMessage });
    } catch (error) {
        console.log("Error on getAllUsers: ", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}; */
/* exports.getAllUserForChat = async (req, res) => {
    const userId = req.payload?._id; // Current user ID

    try {
        // Fetch all users except the logged-in user
        const users = await User.find({ role: "user", _id: { $ne: userId } })
            .select("-password -role -__v")
            .populate("trade");

        // Fetch conversations and last messages
        const usersWithLastMessage = await Promise.all(
            users.map(async (user) => {
                const conversation = await Conversation.findOne({
                    participants: { $all: [userId, user._id] }
                })
                    .sort({ updatedAt: -1 }) // Sort by latest update
                    .populate("lastMessage");

                // Get unread message count
                const unreadCount = await Message.countDocuments({
                    sender: user._id,
                    receiver: userId,
                    isRead: false
                });

                return {
                    ...user.toObject(),
                    lastMessageTime: conversation?.lastMessage ? conversation.updatedAt : new Date(0),
                    lastMessage: conversation?.lastMessage?.message || '',
                    unreadCount
                };
            })
        );

        // Sort by latest message time (descending order)
        usersWithLastMessage.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

        return res.status(200).json({ success: true, result: usersWithLastMessage });
    } catch (error) {
        console.error("Error on getAllUsers: ", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}; */

/* exports.getAllUserForChat = async (req, res) => {
    const userId = req.payload?._id; // Current user ID

    try {
        const usersWithLastMessage = await User.aggregate([
            {
                $match: { role: "user", _id: { $ne: userId } } // Exclude the logged-in user
            },
            {
                $lookup: {
                    from: "conversations",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $in: ["$$userId", "$participants"] },
                                        { $in: [userId, "$participants"] }
                                    ]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "messages",
                                localField: "lastMessage",
                                foreignField: "_id",
                                as: "lastMessageDetails"
                            }
                        },
                        {
                            $unwind: {
                                path: "$lastMessageDetails",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $project: {
                                lastMessage: "$lastMessageDetails.message",
                                lastMessageTime: "$updatedAt",
                                unreadCount: { $ifNull: [{ $getField: { field: userId.toString(), input: "$unreadCounts" } }, 0] }
                            }
                        },
                        { $sort: { lastMessageTime: -1 } }, // Sort by latest update
                        { $limit: 1 } // Get only the latest conversation
                    ],
                    as: "conversationData"
                }
            },
            {
                $addFields: {
                    lastMessage: { $arrayElemAt: ["$conversationData.lastMessage", 0] },
                    lastMessageTime: { $arrayElemAt: ["$conversationData.lastMessageTime", 0] },
                    unreadCount: { $arrayElemAt: ["$conversationData.unreadCount", 0] }
                }
            },
            {
                $project: {
                    password: 0,
                    role: 0,
                    __v: 0,
                    conversationData: 0
                }
            },
            {
                $sort: { lastMessageTime: -1 } // Sort by latest message time
            }
        ]);

        return res.status(200).json({ success: true, result: usersWithLastMessage });
    } catch (error) {
        console.error("Error on getAllUsers: ", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}; */

exports.getAllUserForChat = async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.payload?._id); // Current user ID

    try {
        const usersWithLastMessage = await User.aggregate([
            {
                $match: { role: "user", _id: { $ne: userId } } // Exclude the logged-in user
            },
            {
                $lookup: {
                    from: "chats",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        {
                                            $and: [
                                                { $eq: ["$sender", userId] },
                                                { $eq: ["$receiver", "$$userId"] }
                                            ]
                                        },
                                        {
                                            $and: [
                                                { $eq: ["$receiver", userId] },
                                                { $eq: ["$sender", "$$userId"] }
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } }, // Get the latest message
                        { $limit: 1 }
                    ],
                    as: "lastChat"
                }
            },
            {
                $addFields: {
                    lastMessage: { $arrayElemAt: ["$lastChat.message", 0] },
                    lastMessageTime: { $arrayElemAt: ["$lastChat.createdAt", 0] },
                    unreadCount: {
                        $size: {
                            $filter: {
                                input: "$lastChat",
                                as: "chat",
                                cond: { $eq: ["$$chat.seen", false] }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    password: 0,
                    role: 0,
                    __v: 0,
                    lastChat: 0
                }
            },
            {
                $sort: { lastMessageTime: -1 } // Sort by latest message time
            }
        ]);

        return res.status(200).json({ success: true, result: usersWithLastMessage });
    } catch (error) {
        console.error("Error on getAllUsers: ", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

/* exports.getAllUserForChat = async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.payload?._id); // Current user ID

    try {
        const usersWithLastMessage = await User.aggregate([
            {
                $match: { role: "user", _id: { $ne: userId } } // Exclude the logged-in user
            },
            {
                $lookup: {
                    from: "chats",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        {
                                            $and: [
                                                { $eq: ["$sender", userId] },
                                                { $eq: ["$receiver", "$$userId"] }
                                            ]
                                        },
                                        {
                                            $and: [
                                                { $eq: ["$receiver", userId] },
                                                { $eq: ["$sender", "$$userId"] }
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } }, // Get the latest message
                        { $limit: 1 }
                    ],
                    as: "lastChat"
                }
            },
            {
                $addFields: {
                    lastMessage: { $arrayElemAt: ["$lastChat.message", 0] },
                    lastMessageTime: { $arrayElemAt: ["$lastChat.createdAt", 0] },
                    unreadCount: {
                        $size: {
                            $filter: {
                                input: "$lastChat",
                                as: "chat",
                                cond: {
                                    $and: [
                                        { $eq: [`$$chat.readBy.${userId}`, false] }, // Count messages not read by user
                                        { $eq: ["$$chat.receiver", userId] } // Only messages received by the user
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    password: 0,
                    role: 0,
                    __v: 0,
                    lastChat: 0
                }
            },
            {
                $sort: { lastMessageTime: -1 } // Sort by latest message time
            }
        ]);

        return res.status(200).json({ success: true, result: usersWithLastMessage });
    } catch (error) {
        console.error("Error on getAllUsers: ", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}; */





exports.changeStatusUser = async (req, res) => {
    const id = req.params?.id //user id
    const status = req.body?.status //status (online, offline, busy)

    try {
        const checkUser = await User.findById(id)
        if (!checkUser) {
            return res.status(400).json({ success: false, msg: 'User not found!' })
        }
        checkUser.isActive = status
        const result = await checkUser.save()
        if (result) {
            return res.status(200).json({ success: true, msg: 'User status updated successfully', data: result })
        }
        return res.status(400).json({ success: false, msg: 'Failed to update user status!' })
    } catch (error) {
        console.log("error on changeStatusUser: ", error);
        return res.status(500).json({ error: error, success: false, msg: error.message })
    }
}