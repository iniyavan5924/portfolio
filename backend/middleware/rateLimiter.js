/**
 * -------------------------------------------------------------
 * API Submission Rate Limiter (Anti-Spam Security)
 * -------------------------------------------------------------
 */

const rateLimit = require('express-rate-limit');

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 5, // Limit each IP to 5 contact form submissions per 15-minute window
    message: {
        success: false,
        message: 'Too many submissions from this connection. Please try again in 15 minutes.'
    },
    standardHeaders: true, // Return rate limit info in standard headers
    legacyHeaders: false, // Disable legacy X-RateLimit headers
});

module.exports = contactLimiter;
