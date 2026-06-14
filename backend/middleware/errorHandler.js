/**
 * -------------------------------------------------------------
 * Centralized Global Error Handling Middleware
 * -------------------------------------------------------------
 */

const errorHandler = (err, req, res, next) => {
    // Log the error stack to the console for debugging
    console.error(`[Error Handler] ${err.stack}`);

    // Determine the status code (default to 500 if not set)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        success: false,
        message: err.message || 'Server Error. Please try again later.',
        // Only return stack trace in non-production environments
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
};

module.exports = errorHandler;
