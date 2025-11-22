import express from "express";
import {
    uploadBook,
    getBooksByLevel,
    downloadBook,
    updateBook,
    addStudentToBookWaitingList,
    getLecturerBooks,
    addStudentToAllowedList,
    getBookById,
    removeStudentFromWaitingList  // Import the new controller
} from "../controllers/bookController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../utils/upload.js";

const router = express.Router();

// IMPORTANT: Order matters! Specific routes MUST come BEFORE dynamic /:id routes

// ==================== LECTURER ROUTES ====================

// Upload a new book
router.post("/upload", protect, upload.single('pdf'), uploadBook);

// Get all books uploaded by the lecturer
router.get('/my-books', protect, getLecturerBooks);

// Approve student (add to allowed list)
router.put("/:bookId/add-student/:studentId", protect, addStudentToAllowedList);

// Decline student request (remove from waiting list) - NEW
router.delete("/:bookId/waiting-list/:studentId", protect, removeStudentFromWaitingList);

// Update book metadata or replace file
router.put('/:id', protect, upload.single('pdf'), updateBook);

// ==================== STUDENT ROUTES ====================

// Get books for student's level
router.get("/my-level", protect, getBooksByLevel);

// Request to download a book
router.put("/request-to-download-book/:id", protect, addStudentToBookWaitingList);

// Download a book (MUST be before /:id)
router.get("/download/:bookId", protect, downloadBook);

// ==================== SHARED ROUTES ====================

// Get single book by ID (MUST BE LAST - catches all other GET /:id)
router.get('/:id', protect, getBookById);

export default router;