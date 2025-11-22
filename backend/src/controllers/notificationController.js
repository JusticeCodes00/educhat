// backend/controllers/notificationController.js
import Notification from "../models/Notification.js";

// Get user's notifications
export const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 20, skip = 0 } = req.query;

        const notifications = await Notification.find({
            recipient: userId,
            recipientType: req.user.role
        })
            .populate('sender', 'fullname profilePic')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            recipientType: req.user.role,
            isRead: false
        });

        res.json({
            notifications,
            unreadCount
        });
    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user._id,
            recipientType: req.user.role,
            isRead: false
        });

        res.json({ count });
    } catch (err) {
        console.error("Error getting unread count:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({ message: "Marked as read", notification });
    } catch (err) {
        console.error("Error marking as read:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Mark all as read
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.user._id,
                recipientType: req.user.role,
                isRead: false
            },
            { isRead: true }
        );

        res.json({ message: "All notifications marked as read" });
    } catch (err) {
        console.error("Error marking all as read:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete notification
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOneAndDelete({
            _id: id,
            recipient: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({ message: "Notification deleted" });
    } catch (err) {
        console.error("Error deleting notification:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Create notification (helper - can be called from other controllers)
export const createNotification = async (notificationData) => {
    try {
        const notification = await Notification.create(notificationData);
        return notification;
    } catch (err) {
        console.error("Error creating notification:", err);
        return null;
    }
};