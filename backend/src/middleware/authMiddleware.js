import jwt from 'jsonwebtoken';
import Lecturer from "../models/Lecturer.js";
import Student from "../models/Student.js";

export const protect = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) return res.status(401).json({ message: "Unauthorized - No token provided" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // Try finding user in Lecturer first
        let user = await Lecturer.findById(userId).select("-password");

        // If not found, try Student
        if (!user) {
            user = await Student.findById(userId).select("-password");
        }

        if (!user) return res.status(404).json({ message: "User not found" });

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error("Error in protect middleware:", error);
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Unauthorized - Invalid token" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};