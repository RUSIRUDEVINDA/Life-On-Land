import * as authService from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/generateToken.js";

export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    const user = await authService.registerUser({ name, email, password, role });

    generateToken(user._id, res);

    res.status(201).json({
        message: "User registered successfully",
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
    });
});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await authService.loginUser({ email, password });

    generateToken(user._id, res);

    res.json({
        message: "User logged in successfully",
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
    });
});

export const logoutUser = (req, res) => {
    res.cookie("jwt", "", {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: "Logged out successfully" });
};
