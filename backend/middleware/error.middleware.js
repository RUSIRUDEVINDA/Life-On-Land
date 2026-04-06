export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Handle Mongoose CastError (e.g. invalid ObjectId)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Resource not found. Invalid: ${err.path}`;
    }

    // Handle Mongoose ValidationError
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map((val) => val.message).join(', ');
    }

    res.status(statusCode).json({
        error: message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};
