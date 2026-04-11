import * as userRepo from "../repositories/user.repository.js";
import bcrypt from "bcryptjs";
import { AppError } from "../utils/appError.js"; // custom error class
import crypto from "crypto";

/*
 * @desc    Service to register a new user with hashed password
 * @param   {Object} data - User registration details
 * @returns {Object} Created user document
 */
export const registerUser = async ({ name, email, phone, password, role }) => {
    // Check for existing user records
    const existingUser = await userRepo.findByEmail(email);
    const existingPhone = await userRepo.findByPhone(phone);

    if (existingUser) {
        const error = new Error("User already exists. Please register with a different email.");
        error.statusCode = 400; // Bad Request
        throw error;
    }

    if (existingPhone) {
        const error = new Error("Phone number already exists. Please use a different phone number.");
        error.statusCode = 400; // Bad Request
        throw error;
    }

    // Password security: generates salt and hashes the plain text password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userRepo.create({
        name,
        email,
        phone,
        password: hashedPassword,
        role: role || "RANGER",
    });

    return user;
};

/*
 * @desc    Service to authenticate user login
 * @param   {Object} data - User credentials
 * @returns {Object} User document if verified
 */
export const loginUser = async ({ email, password }) => {
    // Retrieve user including hidden password field for verification
    const user = await userRepo.findByEmailWithPassword(email);

    if (!user) {
        throw new AppError("Invalid email or password", 401); // Unauthorized
    }

    // Compare provided password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new AppError("Invalid email or password", 401);
    }

    return user;
};

export const requestPasswordReset = async ({ email }) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) {
        throw new AppError("Email is required", 400);
    }

    const user = await userRepo.findByEmail(normalizedEmail);
    if (!user) {
        return { user: null, resetToken: null };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await userRepo.updateById(user._id, {
        passwordResetTokenHash,
        passwordResetExpiresAt,
    });

    return { user, resetToken, passwordResetExpiresAt };
};

export const resetPassword = async ({ token, password }) => {
    const t = String(token || "").trim();
    if (!t) {
        throw new AppError("Reset token is required", 400);
    }

    if (!password || typeof password !== "string") {
        throw new AppError("Password is required", 400);
    }

    const passwordResetTokenHash = crypto.createHash("sha256").update(t).digest("hex");
    const user = await userRepo.findByPasswordResetTokenHash(passwordResetTokenHash);

    if (!user) {
        throw new AppError("Reset token is invalid or expired", 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await userRepo.updateById(user._id, {
        password: hashedPassword,
        passwordResetTokenHash: undefined,
        passwordResetExpiresAt: undefined,
    });

    return { userId: user._id };
};
