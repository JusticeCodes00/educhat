import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const lecturerSchema = new mongoose.Schema({
    staffId: {
        type: String,
        required: true,
        unique: true, // ensures no duplicate staff IDs
    },
    profilePic: {
        type: String,
        default: "",
    },
    email: {
        type: String
    },
    fullname: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "Lecturer",
    },
    password: {
        type: String,
        required: true,
    }
}, { timestamps: true });

// Hash password before save
lecturerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        this.password = await bcrypt.hash(this.password, +process.env.BCRYPT_SALT_VALUE);
        next();
    } catch (err) {
        next(err);
    }
});

lecturerSchema.methods.comparePassword = async function (passwordFromRequest) {
    return bcrypt.compare(passwordFromRequest, this.password);
}

const Lecturer = mongoose.model("Lecturer", lecturerSchema);
export default Lecturer;