import Student from "../models/Student.js";

export const getStudents = async (req, res) => {
    try {
        const Students = await Student.find().select("-password");
        res.status(200).json(Students);
    } catch (err) {
        console.error("Error getStudents controllers", err);
        res.status(500).json({ message: "Sever error" })
    }
}