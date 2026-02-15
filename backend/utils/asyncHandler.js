// Utility function to wrap async route handlers and catch errors
export const asyncHandler = (fn) =>
    (req, res, next) =>
        Promise.resolve(fn(req, res, next)).catch(next);

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    // optionally: graceful shutdown
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    // optionally: graceful shutdown
});
