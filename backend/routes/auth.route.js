import express from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/auth.controller.js";
import { validateRegister, validateLogin, } from "../validators/auth.validator.js";

const router = express.Router();

// Register a new user
router.post("/register", validateRegister, registerUser);

// Authenticate user & get token
router.post("/login", validateLogin, loginUser);

// Clear auth cookie
router.post("/logout", logoutUser);

export default router;