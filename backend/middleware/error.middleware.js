export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

export const errorHandler = (err, req, res, next) => {
    // If statusCode is set, use it; otherwise 500
    const statusCode = err.statusCode || 500;

    // For 403 errors, use a user-friendly message
    const message = statusCode === 403
        ? (err.message || "Not authorized to this role")
        : (err.message || "Internal Server Error");

    // Only send user-friendly message, no stack trace
    res.status(statusCode).json({
        message: message,
    });

};
