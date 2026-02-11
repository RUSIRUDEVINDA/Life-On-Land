import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import bcrypt from "bcryptjs";

// Validation helper functions
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    // Minimum 8 chars, at least one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
};

const validateName = (name) => {
    if (typeof name !== "string") return false;

    const trimmed = name.trim();

    if (trimmed.length < 2 || trimmed.length > 50) return false;

    // Allows letters, spaces, hyphens, apostrophes
    const nameRegex = /^[A-Za-z\s'-]+$/;
    if (!nameRegex.test(trimmed)) return false;

    return true;
};


// register user
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body || {};

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }
        // Normalize input
        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        // Validate name
        if (!validateName(normalizedName)) {
            return res.status(400).json({
                error:
                    "Name must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes",
            });
        }

        // Validate email format
        if (!validateEmail(normalizedEmail)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        // Validate password strength
        if (!validatePassword(password)) {
            return res.status(400).json({
                error: "Password must be at least 8 characters with uppercase, lowercase, and number"
            });
        }

        // Validate role if provided
        let userRole = 'RANGER'; 
        if (role) {
            if (!['RANGER', 'ADMIN'].includes(role.toUpperCase())) {
                return res.status(400).json({ error: "Invalid role. Must be 'RANGER' or 'ADMIN'" });
            }
            userRole = role.toUpperCase();
        }

        // Check existing user
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name: normalizedName,
            email: normalizedEmail,
            password: hashedPassword,
            role: userRole,
        });

        // Respond
        res.status(201).json({
            message: "Register successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token: generateToken(user._id, res),
        });

    } catch (error) {
        console.error("Register error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

// login
const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        // Validate email format
        if (!validateEmail(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        // Find user
        const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        res.json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token: generateToken(user._id, res),
        });

    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

const logout = async (req, res) => {
    res.cookie("jwt", "", {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({
        status: "success",
        message: "Logged out successfully",
    });
}

export { register, login, logout };