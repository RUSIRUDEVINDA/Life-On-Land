import express from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/auth.controller.js";
import { validateRegister, validateLogin, } from "../validators/auth.validator.js";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../utils/cloudinary.js";



const router = express.Router();

// Register a new user
router.post("/register", upload.single('profilePhoto'), validateRegister, registerUser);


// Authenticate user & get token
router.post("/login", validateLogin, loginUser);

// Clear auth cookie
router.post("/logout", protect, logoutUser);


export default router;
