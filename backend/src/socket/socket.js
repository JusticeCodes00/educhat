import Message from "../models/Message.js";
import Student from "../models/Student.js";
import Lecturer from "../models/Lecturer.js";
import Group from "../models/Group.js";  // ADD THIS
import Notification from "../models/Notification.js";  // ADD THIS

const onlineUsers = new Map(); // userId → socketId

export default function socketHandler(io) {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // When a user becomes online
        socket.on("user_online", (userId) => {
            onlineUsers.set(userId, socket.id);
            io.emit("update_online_users", Array.from(onlineUsers.keys()));
            console.log("✅ User online:", userId);
        });

        // Send current online users on request
        socket.on("get_online_users", () => {
            socket.emit("update_online_users", Array.from(onlineUsers.keys()));
        });

        socket.on("send_message", async (data) => {
            try {
                const { senderId, senderType, receiverId, text, image } = data;

                console.log({ senderId, senderType, receiverId, text, image })

                // Determine receiver type
                let receiverType = "Student";
                const isStudent = await Student.findById(receiverId);
                if (!isStudent) receiverType = "Lecturer";

                // Save message in MongoDB
                const newMessage = await Message.create({
                    text: text || "",
                    image: image || null,
                    sender: senderId,
                    senderType,
                    receiver: receiverId,
                    receiverType,
                    read: false, // Mark as unread initially
                });

                // Check if receiver is online
                const receiverSocket = onlineUsers.get(receiverId);
                const isReceiverOnline = !!receiverSocket;

                // Emit message to receiver (if online)
                if (isReceiverOnline) {
                    io.to(receiverSocket).emit("receive_message", newMessage);
                }

                // Also emit back to sender (so they update their chat)
                io.to(socket.id).emit("message_sent", newMessage);

                // ✅ CREATE NOTIFICATION FOR NEW MESSAGE
                try {
                    const sender = await (senderType === "Student"
                        ? Student.findById(senderId)
                        : Lecturer.findById(senderId));

                    const notification = await Notification.create({
                        recipient: receiverId,
                        recipientType: receiverType,
                        sender: senderId,
                        senderType: senderType,
                        type: 'message',
                        title: `New message from ${sender.fullname}`,
                        message: text || 'Sent an image',
                        metadata: {
                            messageId: newMessage._id,
                            senderId: senderId
                        }
                    });

                    // Emit notification to receiver if online
                    if (isReceiverOnline) {
                        io.to(receiverSocket).emit("new_notification", notification);
                    }

                    console.log(`✅ Notification created for message to ${receiverId}`);
                } catch (notifErr) {
                    console.error("❌ Failed to create notification:", notifErr);
                }
            } catch (err) {
                console.error("❌ Message error:", err);
                io.to(socket.id).emit("error_message", { message: "Failed to send message" });
            }
        });
        
        // 👥 GROUP MESSAGE - ADD THIS
        socket.on("send_group_message", async (data) => {
            try {
                const { groupId, senderId, senderType, text, image } = data;

                // Check if group exists and user is a member
                const group = await Group.findById(groupId).populate('members.user', 'fullname profilePic');
                if (!group) {
                    return socket.emit("error_message", { message: "Group not found" });
                }

                const isMember = group.members.some(
                    m => m.user._id.toString() === senderId
                );

                if (!isMember) {
                    return socket.emit("error_message", { message: "Not a group member" });
                }

                // Save message in MongoDB
                const newMessage = await Message.create({
                    text: text || "",
                    image: image || null,
                    sender: senderId,
                    senderType,
                    group: groupId,
                });

                await newMessage.populate('sender', 'fullname profilePic role');

                // Update group's lastMessage
                group.lastMessage = newMessage._id;
                await group.save();

                // Emit to all group members (including sender for confirmation)
                group.members.forEach(member => {
                    const memberSocket = onlineUsers.get(member.user._id.toString());
                    if (memberSocket) {
                        io.to(memberSocket).emit("group_message_received", {
                            groupId,
                            message: newMessage
                        });
                    }
                });

                // Create notifications for other members
                const otherMembers = group.members.filter(
                    m => m.user._id.toString() !== senderId
                );

                const notifications = otherMembers.map(member => ({
                    recipient: member.user._id,
                    recipientType: member.userType,
                    sender: senderId,
                    senderType: senderType,
                    type: 'group_message',
                    title: `New message in ${group.name}`,
                    message: text || 'Sent an image',
                    metadata: {
                        groupId: group._id,
                        messageId: newMessage._id
                    }
                }));

                if (notifications.length > 0) {
                    await Notification.insertMany(notifications);

                    // Emit notification to online members
                    otherMembers.forEach(member => {
                        const memberSocket = onlineUsers.get(member.user._id.toString());
                        if (memberSocket) {
                            io.to(memberSocket).emit("new_notification", {
                                type: 'group_message',
                                title: `New message in ${group.name}`,
                                message: text || 'Sent an image'
                            });
                        }
                    });
                }

                console.log(`✅ Group message sent in ${group.name}`);
            } catch (err) {
                console.error("❌ Group message error:", err);
                socket.emit("error_message", { message: "Failed to send group message" });
            }
        });

        // Mark messages as read
        socket.on("mark_as_read", async ({ userId, contactId }) => {
            try {
                // Mark all messages from contactId to userId as read
                await Message.updateMany(
                    {
                        sender: contactId,
                        receiver: userId,
                        read: false
                    },
                    {
                        $set: { read: true }
                    }
                );
                console.log(`✅ Marked messages as read between ${userId} and ${contactId}`);
            } catch (err) {
                console.error("❌ Error marking messages as read:", err);
            }
        });

        // Typing indicator
        socket.on("typing", ({ senderId, receiverId, isTyping }) => {
            const receiverSocket = onlineUsers.get(receiverId);
            if (receiverSocket) {
                io.to(receiverSocket).emit("typing", { senderId, isTyping });
            }
        });

        // When student requests a book
        socket.on("book_request", ({ bookId, studentId, lecturerId }) => {
            const lecturerSocket = onlineUsers.get(lecturerId);
            if (lecturerSocket) {
                io.to(lecturerSocket).emit("book_request_received", { bookId, studentId });
            }
        });

        // When lecturer approves/declines
        socket.on("book_approval_update", ({ bookId, studentId, action }) => {
            const studentSocket = onlineUsers.get(studentId);
            if (studentSocket) {
                io.to(studentSocket).emit("book_status_changed", { bookId, action });
            }
        });

        // Refresh book lists for affected users
        socket.on("book_updated", ({ bookId, affectedUsers }) => {
            affectedUsers.forEach(userId => {
                const userSocket = onlineUsers.get(userId);
                if (userSocket) {
                    io.to(userSocket).emit("refresh_books", { bookId });
                }
            });
        });

        // 🔔 NOTIFICATION EVENTS - ADD THIS
        socket.on("send_notification", async (notificationData) => {
            try {
                const notification = await Notification.create(notificationData);
                await notification.populate('sender', 'fullname profilePic');

                const recipientSocket = onlineUsers.get(notificationData.recipient.toString());
                if (recipientSocket) {
                    io.to(recipientSocket).emit("new_notification", notification);
                }

                console.log(`✅ Notification sent to ${notificationData.recipient}`);
            } catch (err) {
                console.error("❌ Notification error:", err);
            }
        });

        // When user disconnects
        socket.on("disconnect", () => {
            for (let [userId, id] of onlineUsers.entries()) {
                if (id === socket.id) {
                    onlineUsers.delete(userId);
                    console.log("❌ User offline:", userId);
                    io.emit("update_online_users", Array.from(onlineUsers.keys()));
                    break;
                }
            }
        });
    });
}