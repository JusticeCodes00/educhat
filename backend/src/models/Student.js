import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const studentSchema = new mongoose.Schema({
    regNo: {
        type: String,
        required: true,
        unique: true, // each student must have a unique matric number
    },
    fullname: {
        type: String,
        required: true,
    },
    profilePic: {
        type: String,
        default: "",
    },
    email: {
        type: String,
        unique: true,
    },
    level: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "Student",
    }
}, { timestamps: true });

// Hash password before save
studentSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        this.password = await bcrypt.hash(this.password, +process.env.BCRYPT_SALT_VALUE);
        next();
    } catch (err) {
        next(err);
    }
});

studentSchema.methods.comparePassword = async function (passwordFromRequest) {
    return bcrypt.compare(passwordFromRequest, this.password);
}

const Student = mongoose.model('Student', studentSchema);
export default Student;