// backend/models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'recipientType',
        required: true,
    },
    recipientType: {
        type: String,
        enum: ['Student', 'Lecturer'],
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'senderType',
    },
    senderType: {
        type: String,
        enum: ['Student', 'Lecturer'],
    },
    type: {
        type: String,
        enum: [
            'message',           // New message
            'book_approved',     // Book download approved
            'book_declined',     // Book download declined
            'book_request',      // Student requested book
            'group_invite',      // Added to group
            'group_message',     // New group message
            'announcement'       // General announcement
        ],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    link: {
        type: String,  // Link to relevant resource (groupId, bookId, etc)
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,  // Extra data (groupId, bookId, etc)
    }
}, { timestamps: true });

// Indexes for performance
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;