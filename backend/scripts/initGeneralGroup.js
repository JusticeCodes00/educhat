// backend/scripts/initGeneralGroup.js
// Run this once to create the General group
import mongoose from "mongoose";
import dotenv from "dotenv";
import Group from "../src/models/Group.js";
import Student from "../src/models/Student.js";
import Lecturer from "../src/models/Lecturer.js";

dotenv.config();

const initGeneralGroup = async () => {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/educhatDB");
        console.log("Connected to MongoDB");

        // Check if General group already exists
        const existingGroup = await Group.findOne({ groupType: 'general' });
        if (existingGroup) {
            console.log("General group already exists");
            process.exit(0);
        }

        // Get all students and lecturers
        const students = await Student.find();
        const lecturers = await Lecturer.find();

        // Create members array
        const members = [];

        // Add all lecturers
        lecturers.forEach(lecturer => {
            members.push({
                user: lecturer._id,
                userType: 'Lecturer'
            });
        });

        // Add all students
        students.forEach(student => {
            members.push({
                user: student._id,
                userType: 'Student'
            });
        });

        // Use first lecturer as creator (or you can use a specific admin)
        const creator = lecturers[0]?._id;

        if (!creator) {
            console.log("No lecturers found. Create at least one lecturer first.");
            process.exit(1);
        }

        // Create General group
        const generalGroup = await Group.create({
            name: "General Announcements",
            description: "Department-wide announcements and updates",
            creator: creator,
            members: members,
            groupType: 'general',
        });

        console.log("General group created successfully!");
        console.log("Members:", members.length);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
};

initGeneralGroup();

// To run this script:
// node backend/scripts/initGeneralGroup.js