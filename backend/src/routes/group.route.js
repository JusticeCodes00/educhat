// backend/routes/group.route.js
import express from "express";
import {
    createGroup,
    getUserGroups,
    getGroupById,
    addMembers,
    removeMember,
    deleteGroup,
    leaveGroup
} from "../controllers/groupController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new group (Lecturer only)
router.post("/", protect, createGroup);

// Get user's groups
router.get("/", protect, getUserGroups);

// Get single group by ID
router.get("/:id", protect, getGroupById);

// Add members to group (Lecturer only)
router.post("/:groupId/members", protect, addMembers);

// Remove member from group (Lecturer only)
router.delete("/:groupId/members/:userId", protect, removeMember);

// Delete group (Lecturer only)
router.delete("/:id", protect, deleteGroup);

// Leave group (Student)
router.post("/:id/leave", protect, leaveGroup);

export default router;