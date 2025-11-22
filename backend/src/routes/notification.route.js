// backend/routes/notification.route.js
import express from "express";
import {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get user's notifications
router.get("/", protect, getUserNotifications);

// Get unread count
router.get("/unread-count", protect, getUnreadCount);

// Mark notification as read
router.put("/:id/read", protect, markAsRead);

// Mark all as read
router.put("/read-all", protect, markAllAsRead);

// Delete notification
router.delete("/:id", protect, deleteNotification);

export default router;