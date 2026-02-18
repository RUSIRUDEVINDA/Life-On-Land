import express from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/auth.controller.js";
import { validateRegister, validateLogin, } from "../validators/auth.validator.js";

const router = express.Router();

router.post("/register", validateRegister, registerUser);
router.post("/login", validateLogin, loginUser);
router.post("/logout", logoutUser);

export default router;