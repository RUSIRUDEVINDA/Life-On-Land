export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

export const errorHandler = (err, req, res, next) => {
    // If statusCode is set, use it; otherwise 500
    const statusCode = err.statusCode || 500;

    // Only send user-friendly message, no stack trace
    res.status(statusCode).json({
        message: err.message || "Internal Server Error",
    });
    
};

