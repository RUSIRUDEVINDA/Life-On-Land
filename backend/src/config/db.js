import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("MONGO_URI is not defined in environment variables")
            console.error("Please create a .env file with MONGO_URI=mongodb://localhost:27017/your-database-name")
            process.exit(1)
        }
        await mongoose.connect(process.env.MONGO_URI)
        console.log("MongoDB connected successfully")
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message)
        process.exit(1) // Exit the process with failure
    }
}