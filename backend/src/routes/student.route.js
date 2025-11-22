import express from "express";
import { getStudents } from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();


// GET ALL LECTURERS
router.get("/", protect, getStudents)


export default router;