import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI?.trim();
        if (!uri) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }

        await mongoose.connect(uri);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
        // Don't exit immediately, maybe it's a temporary DNS issue
        // But if it's nodemon, exiting is fine as it will restart
        process.exit(1);
    }
}