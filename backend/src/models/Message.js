// backend/models/Message.js - UPDATE YOUR EXISTING ONE
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'senderType',
        required: true,
    },
    senderType: {
        type: String,
        enum: ['Student', 'Lecturer'],
        required: true,
    },
    // For 1-on-1 messages
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'receiverType',
    },
    receiverType: {
        type: String,
        enum: ['Student', 'Lecturer'],
    },
    // For group messages
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
    },
    text: {
        type: String,
        default: "",
    },
    image: {
        type: String,
        default: "",
    },
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'readBy.userType',
        },
        userType: {
            type: String,
            enum: ['Student', 'Lecturer'],
        },
        readAt: {
            type: Date,
            default: Date.now,
        }
    }],
}, { timestamps: true });

// Indexes
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ group: 1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;