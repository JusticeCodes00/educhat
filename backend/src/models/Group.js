// backend/models/Group.js
import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: "",
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecturer",
        required: true,
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'members.userType',
            required: true,
        },
        userType: {
            type: String,
            enum: ['Student', 'Lecturer'],
            required: true,
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        }
    }],
    groupType: {
        type: String,
        enum: ['general', 'custom'],
        default: 'custom',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
    },
}, { timestamps: true });

// Index for faster queries
groupSchema.index({ creator: 1 });
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ groupType: 1 });

const Group = mongoose.model("Group", groupSchema);
export default Group;