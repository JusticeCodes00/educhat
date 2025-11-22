import mongoose from "mongoose";

const connectDB = async () => {
    try {
        try {
            const conn = await mongoose.connect(process.env.MONGO_URI);
            console.log("MONGODB CONNECTED:", conn.connection.host);
        } catch (_) {
            const conn = await mongoose.connect(process.env.MONGO_LOCAL_URI);
            console.log("MONGODB CONNECTED:", conn.connection.host);
        }

    } catch (error) {
        console.error("Error connecting to MONGODB:", error)
        process.exit(1) // 1 status code means fail, 0 means success
    }
}

export default connectDB;