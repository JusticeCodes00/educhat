import mongoose from "mongoose";

const validStudentSchema = new mongoose.Schema({
    regNo: {
        type: String,
        required: true,
        unique: true, // each student must have a unique matric number
    },
    fullname: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    level: {
        type: String,
        required: true,
    }
}, { timestamps: true });

const ValidStudent = mongoose.model("ValidStudent", validStudentSchema);
export default ValidStudent;