import * as userRepo from "../repositories/user.repository.js";
import bcrypt from "bcryptjs";
import { AppError } from "../utils/appError.js"; // custom error class

export const registerUser = async ({ name, email, password, role }) => {
    const existingUser = await userRepo.findByEmail(email);

    if (existingUser) {
        const error = new Error("User already exists. Please register with a different email.");
        error.statusCode = 400; // Bad Request
        throw error;
    }

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

export const loginUser = async ({ email, password }) => {
    const user = await userRepo.findByEmailWithPassword(email);

    if (!user) {
        throw new AppError("Invalid email or password", 401); // Unauthorized
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new AppError("Invalid email or password", 401);
    }

    return user;
};
