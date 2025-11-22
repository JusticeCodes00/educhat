import multer from 'multer';
import path from 'path';
import { sanitizeFilename } from './sanitizeFilename.js';

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/books/') // Store files in uploads/books directory
    },
    filename: (req, file, cb) => {
        // Just save with a timestamp for now - we'll rename it in the controller
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `temp_${timestamp}${ext}`);
    }
});

// Create multer upload middleware
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
});

export default upload;