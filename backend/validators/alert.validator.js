export const validateUpdateAlert = (req, res, next) => {
    const { status, ...others } = req.body || {};
    const errors = [];

    // Check for extra fields
    const extraFields = Object.keys(others);
    if (extraFields.length > 0) {
        errors.push(`Only the 'status' field can be updated for Alerts. Detected disallowed fields: ${extraFields.join(", ")}`);
    }

    // Status validation
    const validStatuses = ["NEW", "ACKNOWLEDGED", "RESOLVED"];
    if (!status) {
        errors.push("The 'status' field is required for updating an Alert.");
    } else if (!validStatuses.includes(status.toUpperCase())) {
        errors.push(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    // Normalize status
    req.body = {
        status: status.toUpperCase()
    };

    next();
};
