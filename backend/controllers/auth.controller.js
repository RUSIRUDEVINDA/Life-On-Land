import * as authService from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/generateToken.js";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, phone, password, role } = req.body;

    // Delegate creation to service layer
    const user = await authService.registerUser({ name, email, phone, password, role });

    // Issue JWT cookie for immediate authentication
    generateToken(user._id, res);

    res.status(201).json({
        message: "User registered successfully",
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
    });
});

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Verify credentials via service
    const user = await authService.loginUser({ email, password });

    // Attach authentication session
    generateToken(user._id, res);

    res.json({
        message: "User logged in successfully",
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
    });
});

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = (req, res) => {
    // Clear the JWT cookie by expiring it immediately
    res.cookie("jwt", "", {
        httpOnly: true,
        expires: new Date(0)
    });
    res.status(200).json({ message: "Logged out successfully" });
};
