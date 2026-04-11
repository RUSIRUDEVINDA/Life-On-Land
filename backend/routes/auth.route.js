import express from "express";
import { registerUser, loginUser, logoutUser, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { validateRegister, validateLogin, validateForgotPassword, validateResetPassword } from "../validators/auth.validator.js";
import { protect } from "../middleware/auth.middleware.js";


const router = express.Router();

// Register a new user
router.post("/register", validateRegister, registerUser);

// Authenticate user & get token
router.post("/login", validateLogin, loginUser);

// Request a password reset link
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.get("/forgot-password", (req, res) => {
    res.status(405).json({ message: "Method Not Allowed. Use POST /api/auth/forgot-password" });
});

// Reset password using token
router.post("/reset-password", validateResetPassword, resetPassword);
router.get("/reset-password", (req, res) => {
    res.status(405).json({ message: "Method Not Allowed. Use POST /api/auth/reset-password" });
});

// Clear auth cookie
router.post("/logout", protect, logoutUser);


export default router;
