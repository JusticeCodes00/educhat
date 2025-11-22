// backend/controllers/groupController.js
import Group from "../models/Group.js";
import Notification from "../models/Notification.js";
import Student from "../models/Student.js";
import Lecturer from "../models/Lecturer.js";

// Create a new group (Lecturer only)
export const createGroup = async (req, res) => {
    try {
        const { name, description, memberIds } = req.body;

        if (req.user.role !== "Lecturer") {
            return res.status(403).json({ message: "Only lecturers can create groups" });
        }

        // Create members array with creator first
        const members = [{
            user: req.user._id,
            userType: 'Lecturer',
        }];

        // Add selected members
        if (memberIds && Array.isArray(memberIds)) {
            for (const id of memberIds) {
                // Check if student exists
                const student = await Student.findById(id);
                if (student) {
                    members.push({
                        user: id,
                        userType: 'Student',
                    });
                }
            }
        }

        const group = await Group.create({
            name,
            description,
            creator: req.user._id,
            members,
            groupType: 'custom',
        });

        await group.populate([
            { path: 'creator', select: 'fullname profilePic' },
            { path: 'members.user', select: 'fullname profilePic role' }
        ]);

        // Create notifications for added members
        if (memberIds && memberIds.length > 0) {
            const notifications = memberIds.map(studentId => ({
                recipient: studentId,
                recipientType: 'Student',
                sender: req.user._id,
                senderType: 'Lecturer',
                type: 'group_invite',
                title: 'Added to Group',
                message: `You were added to "${name}" by ${req.user.fullname}`,
                metadata: { groupId: group._id }
            }));

            await Notification.insertMany(notifications);
        }

        res.status(201).json({
            message: "Group created successfully",
            group
        });
    } catch (err) {
        console.error("Error creating group:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Get user's groups
export const getUserGroups = async (req, res) => {
    try {
        const userId = req.user._id;

        const groups = await Group.find({
            'members.user': userId,
            isActive: true
        })
            .populate('creator', 'fullname profilePic')
            .populate('members.user', 'fullname profilePic role')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });

        res.json(groups);
    } catch (err) {
        console.error("Error fetching groups:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Get single group
export const getGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('creator', 'fullname profilePic')
            .populate('members.user', 'fullname profilePic role level');

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is a member
        const isMember = group.members.some(
            m => m.user._id.toString() === req.user._id.toString()
        );

        if (!isMember) {
            return res.status(403).json({ message: "Not a group member" });
        }

        res.json(group);
    } catch (err) {
        console.error("Error fetching group:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Add members to group (Lecturer only)
export const addMembers = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { memberIds } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is creator
        if (group.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only group creator can add members" });
        }

        const newMembers = [];
        const notifications = [];

        for (const id of memberIds) {
            // Check if already a member
            const isMember = group.members.some(m => m.user.toString() === id);
            if (!isMember) {
                const student = await Student.findById(id);
                if (student) {
                    newMembers.push({
                        user: id,
                        userType: 'Student',
                    });

                    notifications.push({
                        recipient: id,
                        recipientType: 'Student',
                        sender: req.user._id,
                        senderType: 'Lecturer',
                        type: 'group_invite',
                        title: 'Added to Group',
                        message: `You were added to "${group.name}"`,
                        metadata: { groupId: group._id }
                    });
                }
            }
        }

        if (newMembers.length > 0) {
            group.members.push(...newMembers);
            await group.save();
            await Notification.insertMany(notifications);
        }

        await group.populate('members.user', 'fullname profilePic role');

        res.json({
            message: `${newMembers.length} member(s) added`,
            group
        });
    } catch (err) {
        console.error("Error adding members:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Remove member from group (Lecturer only)
export const removeMember = async (req, res) => {
    try {
        const { groupId, userId } = req.params;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is creator
        if (group.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only group creator can remove members" });
        }

        group.members = group.members.filter(
            m => m.user.toString() !== userId
        );

        await group.save();

        res.json({ message: "Member removed successfully" });
    } catch (err) {
        console.error("Error removing member:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete group (Lecturer only)
export const deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;

        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is creator
        if (group.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only group creator can delete group" });
        }

        // Don't allow deleting general group
        if (group.groupType === 'general') {
            return res.status(403).json({ message: "Cannot delete general group" });
        }

        group.isActive = false;
        await group.save();

        res.json({ message: "Group deleted successfully" });
    } catch (err) {
        console.error("Error deleting group:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Leave group (Student only)
export const leaveGroup = async (req, res) => {
    try {
        const { id } = req.params;

        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Can't leave general group
        if (group.groupType === 'general') {
            return res.status(403).json({ message: "Cannot leave general group" });
        }

        group.members = group.members.filter(
            m => m.user.toString() !== req.user._id.toString()
        );

        await group.save();

        res.json({ message: "Left group successfully" });
    } catch (err) {
        console.error("Error leaving group:", err);
        res.status(500).json({ message: "Server error" });
    }
};