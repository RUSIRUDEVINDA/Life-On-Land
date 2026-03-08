import * as userRepo from "../repositories/user.repository.js";
import bcrypt from "bcryptjs";
import { AppError } from "../utils/appError.js"; // custom error class

/*
 * @desc    Service to register a new user with hashed password
 * @param   {Object} data - User registration details
 * @returns {Object} Created user document
 */
export const registerUser = async ({ name, email, password, role }) => {
    // Check for existing user records
    const existingUser = await userRepo.findByEmail(email);

    if (existingUser) {
        const error = new Error("User already exists. Please register with a different email.");
        error.statusCode = 400; // Bad Request
        throw error;
    }

    // Password security: generates salt and hashes the plain text password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userRepo.create({
        name,
        email,
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
