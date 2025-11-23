import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import bookRoutes from "./routes/book.route.js";
import fs from "fs";
import lecturerRoutes from "./routes/lecturer.route.js";
import studentRoutes from "./routes/student.route.js";
import messagesRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js"; // ADD THIS
import notificationRoutes from "./routes/notification.route.js"; // ADD THIS
import socketHandler from "./socket/socket.js";

dotenv.config();
const __dirname = path.resolve();

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  maxHttpBufferSize: 1e7,
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

app.use(express.json({ limit: "10mb" }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);
app.use(cookieParser());

// Initialize socket.io logic
socketHandler(io);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "uploads", "books");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
else console.log("upload folder exists");

app.use("/uploads", express.static("uploads")); // Serve uploaded files

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/lecturer", lecturerRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/groups", groupRoutes); // ADD THIS
app.use("/api/notifications", notificationRoutes); // ADD THIS

// Health check endpoints
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'Educhat API is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "/src/dist")));

//   app.get("*", (_, res) => {
//     res.sendFile(path.join(__dirname, "index.html"));
//   });
// }

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
