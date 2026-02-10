import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            index: true // Add an index for faster queries on email
        },
        password: {
            type: String,
            required: true,
            select: false // Exclude password from query results by default
        },
        role: {
            type: String,
            enum: ["ADMIN", "RANGER"],
            default: "RANGER"
        }
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;