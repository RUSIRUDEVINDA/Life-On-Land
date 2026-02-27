const allowedRoles = ["ADMIN", "RANGER"]; // Must match your Mongoose schema

export const validateRegister = (req, res, next) => {
    const { name, email, password, role } = req.body;
    const errors = [];

    // Name validation
    if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 50 || !/^[a-zA-Z\s]+$/.test(name) || name.trim().split(/\s+/).length < 2) {
        errors.push("Name is required and must be 2 or more words with only letters and spaces");
    }

    // Email validation
    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
        errors.push("Valid email is required");
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
