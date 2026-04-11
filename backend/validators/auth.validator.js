import { normalizeSriLankanPhone } from "../utils/phone.js";

const allowedRoles = ["ADMIN", "RANGER"]; // Must match your Mongoose schema

export const validateRegister = (req, res, next) => {
    const { name, email, phone, password, role } = req.body;
    const errors = [];

    // Name validation
    if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 50 || !/^[a-zA-Z\s]+$/.test(name) || name.trim().split(/\s+/).length < 2) {
        errors.push("Name is required and must be 2 or more words with only letters and spaces");
    }

    // Email validation
    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
        errors.push("Valid email is required");
    }

    // Phone validation (Sri Lanka)
    const normalizedPhone = normalizeSriLankanPhone(phone);
    if (!normalizedPhone) {
        errors.push("Valid Sri Lankan phone number is required");
    } else {
        req.body.phone = normalizedPhone;
    }

    // Password validation
    if (!password || typeof password !== "string" || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
        errors.push("Password must be at least 8 characters long and contain uppercase, lowercase, and a number");
    }

    // Role validation
    if (!role || typeof role !== "string" || !allowedRoles.includes(role.toUpperCase())) {
        errors.push(`Role must be one of: ${allowedRoles.join(" or ")}`);
    } else {
        // Normalize role to uppercase early if valid
        req.body.role = role.toUpperCase();
    }


    if (errors.length > 0) {
        return res.status(400).json({
            error: "Validation failed",
            details: errors,
        });
    }

    // Normalize role before passing it forward
    req.body.role = role.toUpperCase();

    next();
};

export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    // Email validation
    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
        errors.push("Valid email is required");
    }

    // Password validation
    if (!password || typeof password !== "string") {
        errors.push("Password is required");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: "Validation failed",
            details: errors,
        });
    }

    next();
};

export const validateForgotPassword = (req, res, next) => {
    const { email } = req.body;
    const errors = [];

    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
        errors.push("Valid email is required");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: "Validation failed",
            details: errors,
        });
    }

    req.body.email = email.trim();
    next();
};

export const validateResetPassword = (req, res, next) => {
    const { token, password } = req.body;
    const errors = [];

    if (!token || typeof token !== "string" || token.trim().length < 16 || token.trim().length > 512) {
        errors.push("Valid reset token is required");
    }

    if (
        !password ||
        typeof password !== "string" ||
        password.length < 8 ||
        !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/\d/.test(password)
    ) {
        errors.push("Password must be at least 8 characters long and contain uppercase, lowercase, and a number");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: "Validation failed",
            details: errors,
        });
    }

    req.body.token = token.trim();
    next();
};
