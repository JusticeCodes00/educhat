import Message from "../models/Message.js";
import Student from "../models/Student.js";
import Lecturer from "../models/Lecturer.js";
import Group from "../models/Group.js";
import Notification from "../models/Notification.js";

// Send a message to a user (Student or Lecturer)
export const sendMessage = async (req, res) => {
    try {
        const senderId = req.user._id; // Assuming you attach the logged-in user to req.user
        const senderType = req.user.role; // "Student" or "Lecturer"

        const receiverId = req.params.receiverId; // ID of the receiver
        const { text, image } = req.body;

        if (!text && !image) {
            return res.status(400).json({ message: "Cannot send empty message" });
        }

        // Determine receiver type by checking DB
        let receiver;
        let receiverType;
        receiver = await Student.findById(receiverId);
        if (receiver) receiverType = "Student";

        if (!receiver) {
            receiver = await Lecturer.findById(receiverId);
            if (receiver) receiverType = "Lecturer";
        }

        if (!receiver) {
            return res.status(404).json({ message: "Receiver not found" });
        }

        // Create and save message
        const newMessage = new Message({
            text: text || "",
            image: image || null, // Data URL string
            sender: senderId,
            senderType,
            receiver: receiverId,
            receiverType,
        });

        await newMessage.save();

        res.status(201).json({
            message: "Message sent successfully",
            messageData: newMessage,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Get messages between two users
export const getConversation = async (req, res) => {
    try {
        const userId = req.user._id;
        const chatWithId = req.params.chatWithId; // other user ID

        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: chatWithId },
                { sender: chatWithId, receiver: userId },
            ],
        })
            .sort({ createdAt: 1 })
            .lean();

        res.status(200).json({ messages });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /messages/myChats
export const getChats = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all messages where the user is sender or receiver (excluding group messages)
        const messages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }],
            group: { $exists: false } // Exclude group messages
        }).lean();

        console.log(messages);

        // Extract unique user IDs of the other side
        const uniqueUserIds = new Set();
        messages.forEach((msg) => {
            // Add safety checks for undefined values
            if (msg.sender && msg.sender.toString() !== userId.toString()) {
                uniqueUserIds.add(msg.sender.toString());
            }
            if (msg.receiver && msg.receiver.toString() !== userId.toString()) {
                uniqueUserIds.add(msg.receiver.toString());
            }
        });

        // Fetch user details for these IDs
        const users = await Promise.all(
            Array.from(uniqueUserIds).map(async (id) => {
                let user = await Student.findById(id).lean();
                if (!user) user = await Lecturer.findById(id).lean();
                return user;
            })
        );

        res.status(200).json(users.filter(Boolean)); // remove nulls if any
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Get unread message counts for current user
export const getUnreadCounts = async (req, res) => {
    try {
        const userId = req.user._id;

        // Aggregate unread messages grouped by sender
        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    receiver: userId,
                    read: false,
                    group: { $exists: false } // Exclude group messages
                }
            },
            {
                $group: {
                    _id: "$sender",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Convert to object format: { senderId: count }
        const countsObj = {};
        unreadCounts.forEach(item => {
            countsObj[item._id.toString()] = item.count;
        });

        res.status(200).json({ unreadCounts: countsObj });
    } catch (error) {
        console.error("Error fetching unread counts:", error);
        res.status(500).json({ message: "Error fetching unread counts" });
    }
};

// Get group messages
export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;

        // Check if user is a member
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isMember = group.members.some(
            m => m.user.toString() === req.user._id.toString()
        );

        if (!isMember) {
            return res.status(403).json({ message: "Not a group member" });
        }

        const messages = await Message.find({ group: groupId })
            .populate('sender', 'fullname profilePic role')
            .sort({ createdAt: 1 });

        res.json({ messages });
    } catch (err) {
        console.error("Error fetching group messages:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Send group message
export const sendGroupMessage = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { text, image } = req.body;

        // Check if user is a member
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isMember = group.members.some(
            m => m.user.toString() === req.user._id.toString()
        );

        if (!isMember) {
            return res.status(403).json({ message: "Not a group member" });
        }

        const message = await Message.create({
            sender: req.user._id,
            senderType: req.user.role,
            group: groupId,
            text,
            image: image || "",
        });

        await message.populate('sender', 'fullname profilePic role');

        // Update group's lastMessage
        group.lastMessage = message._id;
        await group.save();

        // Create notifications for other members (except sender)
        const otherMembers = group.members.filter(
            m => m.user.toString() !== req.user._id.toString()
        );

        const notifications = otherMembers.map(member => ({
            recipient: member.user,
            recipientType: member.userType,
            sender: req.user._id,
            senderType: req.user.role,
            type: 'group_message',
            title: `New message in ${group.name}`,
            message: text || 'Sent an image',
            metadata: {
                groupId: group._id,
                messageId: message._id
            }
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        res.status(201).json({ message });
    } catch (err) {
        console.error("Error sending group message:", err);
        res.status(500).json({ message: "Server error" });
    }
};