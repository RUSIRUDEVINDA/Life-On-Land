import * as authService from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/generateToken.js";
import { sendPasswordResetEmail } from "../utils/email.service.js";

const isTestEnv =
    process.env.NODE_ENV === "test" ||
    process.env.JEST_WORKER_ID !== undefined ||
    process.env.npm_lifecycle_event === "test";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, phone, password, role } = req.body || {};
    const userData = { name, email, phone, password, role };

    if (req.file) {
        userData.profilePhoto = req.file.path;
        userData.profilePhotoPublicId = req.file.filename;
    }

    // Delegate creation to service layer
    const user = await authService.registerUser(userData);

    // Issue JWT cookie for immediate authentication
    const token = generateToken(user._id, res);

    res.status(201).json({
        message: "User registered successfully",
        token,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePhoto: user.profilePhoto,
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
    const token = generateToken(user._id, res);

    res.json({
        message: "User logged in successfully",
        token,
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

// @desc    Request a password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const { user, resetToken } = await authService.requestPasswordReset({ email });

    let resetUrl = null;
    if (user && resetToken) {
        const result = await sendPasswordResetEmail({
            to: user.email,
            name: user.name,
            resetToken,
        });
        resetUrl = result?.resetUrl || null;
    }

    const payload = {
        message: "If an account exists for that email, a password reset link has been sent.",
    };

    if (isTestEnv && user && resetToken) {
        payload.resetToken = resetToken;
        payload.resetUrl = resetUrl;
    }

    res.status(200).json(payload);
});

// @desc    Reset password using reset token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    await authService.resetPassword({ token, password });

    res.status(200).json({ message: "Password updated successfully" });
});
