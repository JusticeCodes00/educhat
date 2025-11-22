import mongoose from "mongoose";

const validLecturerSchema = new mongoose.Schema({
    staffId: {
        type: String,
        required: true,
        unique: true, // ensures no duplicate staff IDs
    },
    fullname: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    courses: {
        type: [String], // array of course names
        default: [],    // default to empty array
    }
}, { timestamps: true });

const ValidLecturer = mongoose.model("ValidLecturer", validLecturerSchema);
export default ValidLecturer;