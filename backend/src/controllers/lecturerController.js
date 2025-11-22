import Lecturer from "../models/Lecturer.js";

export const getLecturers = async (req, res) => {
    try {
        const lecturers = await Lecturer.find().select("-password");
        res.status(200).json(lecturers);
    } catch (err) {
        console.error("Error getLecturers controllers", err);
        res.status(500).json({message:"Sever error"})
    }
}