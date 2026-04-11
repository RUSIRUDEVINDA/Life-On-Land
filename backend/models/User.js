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
            index: true // Faster lookups for login
        },
        phone: {
            type: String,
            required: true,
            unique: true,
            index: true,
            match: [/^\+94[1-9]\d{8}$/, "Phone must be a valid Sri Lankan number"]
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
        },
        passwordResetTokenHash: {
            type: String,
            index: true,
            select: false
        },
        passwordResetExpiresAt: {
            type: Date,
            index: true,
            select: false
        }
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
