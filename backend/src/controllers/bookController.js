import path from "path";
import fs from "fs";
import Book from "../models/Book.js";
import Student from "../models/Student.js";
import Lecturer from "../models/Lecturer.js";
import { sanitizeFilename } from "../utils/sanitizeFilename.js";

/* ============================================================
   📚 LECTURER CONTROLLERS
   ============================================================ */

// ======================= Upload a Book (Lecturer Only) =======================
export const uploadBook = async (req, res) => {
    try {
        const { title, description, level, courseCode, price } = req.body;
        
        console.log(req.user)
        if (req.user.role !== "Lecturer") {
            return res.status(403).json({ message: "Only lecturers can upload books" });
        }

        if (!level || !courseCode || !req.file) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (!["ND", "HND"].includes(level)) {
            return res.status(400).json({ message: "Level must be either ND or HND" });
        }

        const existingBook = await Book.findOne({
            title: title.trim(),
            courseCode: courseCode.trim().toUpperCase(),
        });

        if (existingBook) {
            return res.status(409).json({
                message: "Book already exits",
                existingBookId: existingBook._id,
            });
        }

        const ext = path.extname(req.file.originalname);
        const sanitizedTitle = sanitizeFilename(`${title.trim()}_${courseCode.trim()}`);
        const finalFilename = `${sanitizedTitle}${ext}`;

        const oldPath = path.join(process.cwd(), "uploads/books", req.file.filename);
        const newPath = path.join(process.cwd(), "uploads/books", finalFilename);

        fs.renameSync(oldPath, newPath);

        const fileUrl = `/uploads/books/${finalFilename}`;
        const derivedTitle = title?.trim() || sanitizedTitle.replace(/[_-]+/g, " ").trim();

        const newBook = await Book.create({
            title: derivedTitle,
            description: description?.trim() || "",
            level: level.toUpperCase(),
            courseCode: courseCode.trim().toUpperCase(),
            fileUrl,
            originalFilename: req.file.originalname,
            price: Number(price) || 0,
            author: req.user._id,
            allowedStudents: [],
            studentsDownloaded: [],
        });

        await newBook.populate("author", "fullName staffId");

        res.status(201).json({
            message: "Book uploaded successfully",
            book: newBook,
        });
    } catch (err) {
        console.error("Error uploading book:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ========================= Get Books Uploaded by Lecturer =======================
export const getLecturerBooks = async (req, res) => {
    try {
        const { _id, role } = req.user;

        if (role !== "Lecturer") {
            return res.status(403).json({ message: "Only lecturers can access this route." });
        }

        const lecturer = await Lecturer.findById(_id);
        if (!lecturer) return res.status(404).json({ message: "Lecturer not found." });

        const books = await Book.find({ author: _id }).populate("author", "fullName staffId");

        if (!books.length) {
            return res.status(200).json(books);
        }

        res.status(200).json(books);
    } catch (err) {
        console.error("Error in getLecturerBooks:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ======================= Update Book (Lecturer Only) =======================
export const updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, level, courseCode, price } = req.body;

        const book = await Book.findById(id);
        if (!book) return res.status(404).json({ message: "Book not found" });

        if (book.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this book" });
        }

        if (level && !["ND", "HND"].includes(level.toUpperCase())) {
            return res.status(400).json({ message: "Level must be ND or HND" });
        }

        // Handle file replacement if new file uploaded
        if (req.file) {
            try {
                const oldRelative = book.fileUrl.startsWith("/") ? book.fileUrl.slice(1) : book.fileUrl;
                const oldAbs = path.resolve(process.cwd(), oldRelative);
                if (fs.existsSync(oldAbs)) fs.unlinkSync(oldAbs);
            } catch (err) {
                console.warn("Could not delete old file:", err);
            }

            const ext = path.extname(req.file.originalname);
            const newTitle = title || book.title;
            const newCode = courseCode || book.courseCode;
            const sanitizedTitle = sanitizeFilename(`${newTitle.trim()}_${newCode.trim()}`);
            const finalFilename = `${sanitizedTitle}${ext}`;

            const oldPath = path.join(process.cwd(), "uploads/books", req.file.filename);
            const newPath = path.join(process.cwd(), "uploads/books", finalFilename);
            fs.renameSync(oldPath, newPath);

            book.fileUrl = `/uploads/books/${finalFilename}`;
            book.originalFilename = req.file.originalname;
        }

        if (title) book.title = title.trim();
        if (description !== undefined) book.description = description.trim();
        if (level) book.level = level.toUpperCase();
        if (courseCode) book.courseCode = courseCode.trim().toUpperCase();
        if (price !== undefined) book.price = Number(price) || 0;

        await book.save();
        await book.populate("author", "fullName staffId");

        res.status(200).json({ message: "Book updated successfully", book });
    } catch (err) {
        console.error("Error updating book:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ======================= Add Student to Allowed List (Lecturer Only) =======================
export const addStudentToAllowedList = async (req, res) => {
    try {
        const lecturerId = req.user._id;
        const { bookId, studentId } = req.params;

        if (req.user.role !== "Lecturer") {
            return res.status(403).json({ message: "Only lecturers can add students." });
        }

        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ message: "Book not found." });

        if (book.author.toString() !== lecturerId.toString()) {
            return res.status(403).json({ message: "You are not the author of this book." });
        }

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: "Student not found." });

        if (book.allowedStudents.includes(studentId)) {
            return res.status(409).json({
                message: "Student already allowed.",
                code: "STUDENT_ALREADY_ALLOWED"
            });
        }

        // ADD TO ALLOWED LIST
        book.allowedStudents.push(studentId);

        // REMOVE FROM WAITING LIST (THIS WAS MISSING!)
        book.waitingList = book.waitingList.filter(
            id => id.toString() !== studentId.toString()
        );

        await book.save();
        await book.populate("allowedStudents", "fullname regNo level");
        await book.populate("waitingList", "fullname level profilePic");

        res.status(200).json({
            message: "Student added to allowed list successfully.",
            book,
        });
    } catch (err) {
        console.error("Error in addStudentToAllowedList:", err);
        res.status(500).json({ message: "Server error" });
    }
};


/* ============================================================
   🎓 STUDENT CONTROLLERS
   ============================================================ */

// ======================= Add Student to Waiting List =======================
export const addStudentToBookWaitingList = async (req, res) => {
    try {
        const studentId = req.user._id;
        const { id: bookId } = req.params;

        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ message: "Book not found" });

        // Check if already approved
        if (book.allowedStudents?.includes(studentId)) {
            return res.status(400).json({
                message: "You are already approved for this book",
                code: "ALREADY_APPROVED"
            });
        }

        // Check if already in waiting list
        if (book.waitingList?.includes(studentId)) {
            return res.status(400).json({
                message: "Already added to waiting list",
                code: "ALREADY_WAITING"
            });
        }

        book.waitingList = book.waitingList || [];
        book.waitingList.push(studentId);
        await book.save();

        res.status(200).json({ message: "Added to waiting list successfully" });
    } catch (err) {
        console.error("Error in addStudentToBookWaitingList:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ======================= Get Books by Student Level =======================
export const getBooksByLevel = async (req, res) => {
    try {
        const studentId = req.user._id;  // Get student ID
        const studentLevel = req.user.level;

        const books = await Book.find({ level: studentLevel })
            .populate("author", "fullname _id")
            .select('title description level courseCode price downloads waitingList allowedStudents fileUrl');

        // Convert to plain objects and check if student is in arrays
        const booksWithStatus = books.map(book => {
            const bookObj = book.toObject();
            return {
                ...bookObj,
                // Keep these as arrays of IDs for easier checking on frontend
                waitingList: bookObj.waitingList || [],
                allowedStudents: bookObj.allowedStudents || []
            };
        });

        res.status(200).json(booksWithStatus);
    } catch (err) {
        console.error("Error in getBooksByLevel:", err);
        res.status(500).json({ message: "Server error" });
    }
};

/* ============================================================
   🧾 SHARED CONTROLLERS
   ============================================================ */

// ======================= Download Book (Student) =======================
export const downloadBook = async (req, res) => {
    try {
        const { bookId } = req.params;
        const studentId = req.user._id;

        console.log('Download request for book:', bookId, 'by student:', studentId);

        const book = await Book.findById(bookId);
        if (!book) {
            console.log('Book not found:', bookId);
            return res.status(404).json({ message: "Book not found" });
        }

        // Check level
        if (book.level && book.level !== req.user.level) {
            console.log('Level mismatch:', book.level, 'vs', req.user.level);
            return res.status(403).json({ message: "This book is not for your level" });
        }

        // Check if student is in allowed list
        const isAllowed = book.allowedStudents?.some(
            id => id.toString() === studentId.toString()
        );

        if (!isAllowed) {
            console.log('Student not in allowed list');
            return res.status(403).json({
                message: "You are not allowed to download this book. Please request access first.",
                code: "NOT_ALLOWED"
            });
        }

        // Track download (only once per student)
        const hasDownloaded = book.studentsDownloaded?.some(
            id => id.toString() === studentId.toString()
        );

        if (!hasDownloaded) {
            book.downloads += 1;
            book.studentsDownloaded = book.studentsDownloaded || [];
            book.studentsDownloaded.push(studentId);
            await book.save();
        }

        // Build file path
        const relativePath = book.fileUrl.startsWith("/") ? book.fileUrl.slice(1) : book.fileUrl;
        const absolutePath = path.resolve(process.cwd(), relativePath);

        console.log('Attempting to send file:', absolutePath);

        if (!fs.existsSync(absolutePath)) {
            console.log('File not found at path:', absolutePath);
            return res.status(404).json({ message: "File not found on server" });
        }

        // Set headers for download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${book.originalFilename}"`);

        // Send file
        return res.sendFile(absolutePath, (err) => {
            if (err) {
                console.error("Error sending file:", err);
                if (!res.headersSent) {
                    return res.status(500).json({ message: "Error sending file" });
                }
            }
        });
    } catch (err) {
        console.error("Error in downloadBook:", err);
        if (!res.headersSent) {
            res.status(500).json({ message: "Server error" });
        }
    }
};

export const getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
            .populate('author', 'fullname profilePic')
            .populate('waitingList', 'fullname level profilePic')
            .populate('allowedStudents', '_id');

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.json(book);
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const removeStudentFromWaitingList = async (req, res) => {
    try {
        const lecturerId = req.user._id;
        const { bookId, studentId } = req.params;

        if (req.user.role !== "Lecturer") {
            return res.status(403).json({ message: "Only lecturers can decline requests." });
        }

        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ message: "Book not found." });

        if (book.author.toString() !== lecturerId.toString()) {
            return res.status(403).json({ message: "You are not the author of this book." });
        }

        // Check if student is in waiting list
        const isInWaitingList = book.waitingList?.some(
            id => id.toString() === studentId.toString()
        );

        if (!isInWaitingList) {
            return res.status(404).json({ message: "Student not found in waiting list." });
        }

        // Remove from waiting list
        book.waitingList = book.waitingList.filter(
            id => id.toString() !== studentId.toString()
        );

        await book.save();
        await book.populate("waitingList", "fullname level profilePic");

        res.status(200).json({
            message: "Student request declined successfully.",
            book,
        });
    } catch (err) {
        console.error("Error in removeStudentFromWaitingList:", err);
        res.status(500).json({ message: "Server error" });
    }
};
