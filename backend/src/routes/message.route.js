import express from "express";
import { sendMessage, getConversation, getChats, getUnreadCounts, getGroupMessages, sendGroupMessage } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect)
// 🔹 Send a message to a specific user (Student or Lecturer)
// POST /messages/send/:receiverId
router.post("/send/:receiverId", sendMessage);

// 🔹 Get all messages between the logged-in user and another user
// GET /messages/conversation/:chatWithId
router.get("/conversation/:chatWithId", getConversation);

router.get("/myChats", getChats)

router.get("/unreadCounts", getUnreadCounts)

router.get("/group/:groupId", protect, getGroupMessages);
router.post("/group/:groupId", protect, sendGroupMessage);

export default router;