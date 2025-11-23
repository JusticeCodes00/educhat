import express from "express";
import { registerStudent, me, loginLecturer, loginStudent, registerLecturer, logout, updateProfilePic } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post('/registerLecturer', registerLecturer);
router.post('/loginLecturer', loginLecturer);
router.post('/registerStudent', registerStudent);
router.post('/loginStudent', loginStudent);
router.post("/logout", logout)
router.get('/me', protect, me);
router.put("/updateProfilePic", protect, updateProfilePic)

export default router;
