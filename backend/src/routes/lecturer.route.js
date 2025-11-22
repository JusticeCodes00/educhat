import express from "express";
import { getLecturers } from "../controllers/lecturerController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();


// GET ALL LECTURERS
router.get("/", protect ,getLecturers)


export default router;