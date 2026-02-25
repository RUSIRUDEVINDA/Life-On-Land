export const validateUpdateUser = (isFullUpdate = false) => (req, res, next) => {
    const { name, email, role } = req.body || {};
    const errors = [];

    if (isFullUpdate) {
        // PUT: Mandatory fields
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            errors.push("Name is required for full update");
        }
        if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
            errors.push("Valid email is required for full update");
        }
    } else {
        // PATCH: Optional but must be valid if provided
        if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
            errors.push("Name must be a non-empty string");
        }
        if (email !== undefined && (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email))) {
            errors.push("Email must be a valid format");
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    // Role check is handled in the controller for extra security based on req.user
    next();
};

export const validateUserQuery = (req, res, next) => {
    const { role, page, limit } = req.query || {};
    const errors = [];

    if (role && !["ADMIN", "RANGER"].includes(role.toUpperCase())) {
        errors.push("role must be either ADMIN or RANGER");
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
