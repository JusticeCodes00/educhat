import jwt from "jsonwebtoken";
import ValidStudent from "../models/ValidStudent.js";
import validLecturer from "../models/ValidLecturer.js";
import Student from "../models/Student.js";
import Lecturer from "../models/Lecturer.js";
import { generateToken } from "../utils/generateToken.js";
import ValidLecturer from "../models/ValidLecturer.js";

// ======================= REGISTER STUDENT =======================
export const registerStudent = async (req, res) => {
    try {
        const { fullname, regNo, email, password } = req.body;

        if (!fullname || !regNo || !email || !password)
            return res.status(400).json({ message: 'Missing required fields' });

        // Check if student is valid
        const isValidStudent = /^AKP\/ASC\/SWD\/(ND|HND)\d{4}\/\d{4}$/;

        if (!isValidStudent.test(regNo))
            return res.status(401).json({ message: "Invalid registration number" });

        // Check for existing student
        const existing = await Student.findOne({ regNo });
        if (existing)
            return res.status(409).json({ message: 'Student with that email or regNumber already exists' });

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email))
            return res.status(400).json({ message: "Invalid email format" });

        const level = regNo.split("/")[3].split("").filter(char => isNaN(char)).join("");

        // Create student (pre hook will hash password)
        const savedStudent = await Student.create({ fullname, regNo, email, level, password });

        // Generate JWT and set cookie
        generateToken(savedStudent._id, res);

        res.status(201).json({
            id: savedStudent._id,
            profilePic: savedStudent.profilePic,
            fullname: savedStudent.fullname,
            email: savedStudent.email,
            role: savedStudent.role,
            level: savedStudent.level
        });
    } catch (error) {
        console.error("Error in registerStudent controller:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ======================= LOGIN STUDENT =======================
export const loginStudent = async (req, res) => {
    try {
        const { regNo, password } = req.body;
        if (!regNo || !password)
            return res.status(400).json({ message: "Wrong regNo or password" });

        const student = await Student.findOne({ regNo });
        if (!student)
            return res.status(401).json({ message: "Invalid credentials" });

        const isMatch = await student.comparePassword(password);
        if (!isMatch)
            return res.status(401).json({ message: "Invalid credentials" });

        generateToken(student._id, res);

        res.status(200).json({
            id: student._id,
            fullname: student.fullname,
            regNo: student.regNo,
            email: student.email,
            level: student.level,
            department: student.department,
            profilePic: student.profilePic,
            role: student.role,
        });
    } catch (err) {
        console.error("Error in loginStudent:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ======================= REGISTER LECTURER =======================
export const registerLecturer = async (req, res) => {
    try {
        const { fullname, staffId, courses, password } = req.body;

        if (!fullname || !staffId || !password)
            return res.status(400).json({ message: "Missing required fields" });

        const existing = await Lecturer.findOne({ staffId });
        if (existing)
            return res.status(409).json({ message: "Lecturer already registered" });

        // Create lecturer (pre hook will hash password if you added one)
        const newLecturer = await Lecturer.create({ fullname, staffId, courses, password });

        generateToken(newLecturer._id, res);

        res.status(201).json({
            id: newLecturer._id,
            fullname: newLecturer.fullname,
            staffId: newLecturer.staffId,
            department: newLecturer.department,
            courses: newLecturer.courses,
            profilePic: newLecturer.profilePic,
        });

    } catch (err) {
        console.error("Error in registerLecturer:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ======================= LOGIN LECTURER =======================
export const loginLecturer = async (req, res) => {
    try {
        const { staffId, password } = req.body;

        if (!staffId || !password)
            return res.status(400).json({ message: "Missing staffId or password" });

        const lecturer = await Lecturer.findOne({ staffId });
        if (!lecturer)
            return res.status(401).json({ message: "Invalid credentials" });

        const isMatch = await lecturer.comparePassword(password);
        if (!isMatch)
            return res.status(401).json({ message: "Invalid credentials" });

        generateToken(lecturer._id, res);

       res.status(200).json({
         id: lecturer._id,
         fullname: lecturer.fullname, // ⭐ Changed from fullName to fullname
         role: lecturer.role,
         staffId: lecturer.staffId,
         courses: lecturer.courses,
         department: lecturer.department, // ⭐ Added department
         profilePic: lecturer.profilePic,
       });
    } catch (err) {
        console.error("Error in loginLecturer:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const logout = (req, res) => {
  res.cookie("jwt", "", {
    maxAge: 0,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: true,
    path: "/",
  });
  res.status(200).json({ message: "Logged out successfully" });
};
// ======================= GET CURRENT USER =======================
export const me = (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Not authenticated' });
        console.log(user)
        res.json({ user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ======================= UPDATE PROFILE PIC ======================
export const updateProfilePic = async (req, res) => {
    try {
        const { imageURL } = req.body;
        const { _id: userId, role } = req.user

        let user;

        if (role === "Student") {
            user = await Student.findByIdAndUpdate(userId, { profilePic: imageURL }, { new: false });
        } else {
            user = await Lecturer.findByIdAndUpdate(userId, { profilePic: imageURL }, { new: false });
        }

        if (!user) return res.status(401).json({ message: "There is no profile to update" });

        res.status(200).json({ message: "Profile picture updated" });
    } catch (err) {
        console.error("Error in updateProfilePic:", err);
        res.status(500).json({ message: "Server error" });
    }
}