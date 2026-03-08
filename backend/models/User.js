import mongoose from "mongoose";

/**
 * @desc    System User Schema for RBAC
 */
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
            index: true // Faster lookups for login
        },
        password: {
            type: String,
            required: true,
            select: false // Protection: hidden by default
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
