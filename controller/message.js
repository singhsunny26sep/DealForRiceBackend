const Conversation = require("../model/Conversation");
const Message = require("../model/Message");
const { io, getReceiverSocketId } = require("../soket/socket");


exports.getMessage = async (req, res,) => {
    const { id: userToChatId } = req.params; //it is receiverId
    const senderId = req.user?._id;

    try {
        const { id: userToChatId } = req.params;
        const senderId = req.user._id;

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, userToChatId] },
        }).populate("messages"); // NOT REFERENCE BUT ACTUAL MESSAGES


        /* const conversation = await Conversation.find({
            participants: { $all: [senderId, userToChatId] },
        }).populate("messages")

        if (!conversation) {
            return res.status(404).json({ message: "No conversation found" });
        }
        return res.status(200).json({ result: conversation, success: true }); */
        if (!conversation) {
            return res.status(404).json({ message: "No conversation found", result: [] });
        }
        return res.status(200).json({ result: conversation, success: true });
    } catch (error) {
        console.log("error on getMessage: ", error);
        return res.status(500).json({ message: error.message, error: error, success: false });
    }
}

/* exports.sendMessage = async (req, res) => {
    // console.log("req.params: ", req.params);
    // console.log("req.body: ", req.body);
    // console.log("erq.user: ", req.user);


    const { id: receiverId } = req.params; //it is receiverId
    const senderId = req.user?._id;
    const message = req.body.message;


    try {
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        })
        if (!conversation) {
            conversation = await Conversation.create({ participants: [senderId, receiverId] })
        }
        const newMessage = new Message({ senderId, receiverId, message });

        if (newMessage) {
            conversation.messages.push(newMessage?._id);
        }
        // await conversation.save();
        // await newMessage.save();
        await Promise.all([conversation.save(), newMessage.save()]);

        const receiverSocketId = getReceiverSocketId(receiverId)
        if (receiverSocketId) {
            // io.to(<socket_id>).emit() used to send events to specifice client
            io.to(receiverSocketId).emit('newMessage', newMessage);  // emitting to the receiver's socket
        }

        return res.status(200).json({ result: newMessage, success: true });
    } catch (error) {
        console.log("error on sendMessage: ", error);
        return res.status(500).json({ message: error.message, error: error, success: false });
    }
} */

/* exports.sendMessage = async (req, res) => {
    try {
        // console.log("req.body: ", req.body);
        // console.log("req.params:  ", req.params);


        const { message } = req.body;
        const receiverId = req.params?.id
        const senderId = req.user?._id;

        // console.log("receiverId: ", receiverId);
        // console.log("senderId: ", senderId);
        // console.log("message: ", message);

        if (!senderId) {
            return res.status(401).json({ success: false, message: "Unauthorized: No sender ID found." });
        }

        if (!message?.trim()) {
            return res.status(400).json({ success: false, message: "Message cannot be empty." });
        }

        // Create new message
        const newMessage = await Message.create({ senderId, receiverId, message });

        // Find existing conversation
        let conversation = await Conversation.findOne({ participants: { $all: [senderId, receiverId] } });

        if (!conversation) {
            // Create new conversation if none exists
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
                messages: [newMessage._id],
                lastMessage: newMessage._id,
                unreadCounts: { [receiverId]: 1 }
            });
        } else {
            // Update existing conversation
            conversation.messages.push(newMessage._id);
            conversation.lastMessage = newMessage._id;
            conversation.unreadCounts.set(receiverId, (conversation.unreadCounts.get(receiverId) || 0) + 1);
        }

        // Save conversation and message in parallel
        await Promise.all([conversation.save(), newMessage.save()]);

        // Emit real-time event to the receiver if they are online
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        return res.status(201).json({ success: true, result: newMessage });
    } catch (error) {
        console.error("Error in sendMessage:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}; */

exports.sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const receiverId = req.params?.id;
        const senderId = req.user?._id;

        if (!senderId) {
            return res.status(401).json({ success: false, message: "Unauthorized: No sender ID found." });
        }

        if (!message?.trim()) {
            return res.status(400).json({ success: false, message: "Message cannot be empty." });
        }

        // Create new message with read status initialized to false for both users
        const newMessage = await Message.create({
            senderId,
            receiverId,
            message,
            readBy: { [senderId]: true, [receiverId]: false } // Sender has read it by default
        });

        let conversation = await Conversation.findOne({ participants: { $all: [senderId, receiverId] } });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
                messages: [newMessage._id],
                lastMessage: newMessage._id,
                unreadCounts: { [receiverId]: 1 }
            });
        } else {
            conversation.messages.push(newMessage._id);
            conversation.lastMessage = newMessage._id;
            conversation.unreadCounts.set(receiverId, (conversation.unreadCounts.get(receiverId) || 0) + 1);
        }

        await Promise.all([conversation.save(), newMessage.save()]);

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
            io.to(receiverSocketId).emit("chnages")
        }

        return res.status(201).json({ success: true, result: newMessage });
    } catch (error) {
        console.error("Error in sendMessage:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};



exports.markAsRead = async (req, res) => {
    const { id: conversationId } = req.params;
    const userId = req.user._id;

    // console.log("conversationId: ", conversationId);
    // console.log("userId: ", userId);

    try {

        await Conversation.findByIdAndUpdate(conversationId, {
            $set: { [`unreadCounts.${userId}`]: 0 }
        });

        res.status(200).json({ success: true, message: "Messages marked as read" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


exports.markMessagesAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?._id;

        // Find unread messages in the conversation
        const messages = await Message.find({
            receiverId: userId,
            "readBy.${userId}": { $ne: true } // Messages not read by the user
        });

        if (!messages.length) {
            return res.status(200).json({ success: true, message: "No unread messages." });
        }

        // Update messages as read for this user
        await Message.updateMany(
            { receiverId: userId },
            { $set: { [`readBy.${userId}`]: true } }
        );
        if (messages.length) {
            io.to(getReceiverSocketId(messages[0].senderId)).emit("messageRead", { conversationId, userId });
        }


        return res.status(200).json({ success: true, message: "Messages marked as read." });

    } catch (error) {
        console.error("Error in markMessagesAsRead:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
