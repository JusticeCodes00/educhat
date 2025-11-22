import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: "",
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecturer",
        required: true,
    },
    level: {
        type: String,
        required: true, // book is for either ND or HND students
    },
    courseCode: {
        type: String,
        required: true,
    },
    fileUrl: {
        type: String,
        required: true, // path or URL to the PDF
    },
    waitingList: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
        },
    ],
    originalFilename: {
        type: String,
        required: true, // original filename as uploaded
    },
    price: {
        type: Number,
        default: 0, // 0 = free
    },
    allowedStudents: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
        },
    ],
    downloads: {
        type: Number,
        default: 0,
    },
    studentsDownloaded: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
        },
    ],
}, { timestamps: true });

const Book = mongoose.model("Book", bookSchema);
export default Book;