import { normalizeSriLankanPhone } from "../utils/phone.js";

export const validateUpdateUser = (isFullUpdate = false) => (req, res, next) => {
    const { name, email, phone, role, password } = req.body || {};
    const errors = [];
    const isRanger = req.user && req.user.role === "RANGER";

    if (isFullUpdate) {
        // PUT: Mandatory fields
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            errors.push("Name is required for full update");
        }
        if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
            errors.push("Valid email is required for full update");
        }
        if (!phone || !normalizeSriLankanPhone(phone)) {
            errors.push("Valid Sri Lankan phone number is required for full update");
        }
        // Admin must provide role in PUT
        if (!isRanger && (!role || typeof role !== "string")) {
            errors.push("Role is required for Admin full update");
        }
    } else {
        // PATCH: Optional but must be valid if provided
        if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
            errors.push("Name must be a non-empty string");
        }
        if (email !== undefined && (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email))) {
            errors.push("Email must be a valid format");
        }
        if (phone !== undefined && !normalizeSriLankanPhone(phone)) {
            errors.push("Phone must be a valid Sri Lankan number");
        }
    }

    // Password validation (Always same rules if provided)
    if (password !== undefined) {
        if (!password || typeof password !== "string" || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
            errors.push("Password must be at least 8 characters long and contain uppercase, lowercase, and a number");
        }
    }

    // Role validation and normalization
    const ALLOWED_ROLES = ["ADMIN", "RANGER"];
    if (role !== undefined) {
        if (typeof role !== "string" || !ALLOWED_ROLES.includes(role.toUpperCase())) {
            errors.push(`Role must be one of: ${ALLOWED_ROLES.join(" or ")}`);
        } else {
            req.body.role = role.toUpperCase();
        }
    }

    if (phone !== undefined) {
        const normalizedPhone = normalizeSriLankanPhone(phone);
        if (normalizedPhone) {
            req.body.phone = normalizedPhone;
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    next();
};

export const validateUserQuery = (req, res, next) => {
    const { role, page, limit, name, email, phone } = req.query || {};
    const errors = [];

    if (role && !["ADMIN", "RANGER"].includes(role.toUpperCase())) {
        errors.push("role must be either ADMIN or RANGER");
    }

    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
        errors.push("name must be a non-empty string");
    }

    if (email !== undefined && (typeof email !== "string" || email.trim().length === 0)) {
        errors.push("email must be a non-empty string");
    }
    if (phone !== undefined) {
        const normalizedPhone = normalizeSriLankanPhone(phone);
        if (!normalizedPhone) {
            errors.push("phone must be a valid Sri Lankan number");
        } else {
            req.query.phone = normalizedPhone;
        }
    }

    if (page !== undefined) {
        const p = Number(page);
        if (isNaN(p) || p < 1) errors.push("page must be a number >= 1");
    }

    if (limit !== undefined) {
        const l = Number(limit);
        if (isNaN(l) || l < 1 || l > 100) errors.push("limit must be a number between 1 and 100");
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    next();
};
