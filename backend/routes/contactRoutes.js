/**
 * -------------------------------------------------------------
 * Contact Routes Configuration
 * -------------------------------------------------------------
 */

const express = require('express');
const { body } = require('express-validator');
const { submitContact } = require('../controllers/contactController');
const contactLimiter = require('../middleware/rateLimiter');

const router = express.Router();

// Define input validation rules using express-validator
const validateContactInput = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address'),
    body('subject')
        .trim()
        .notEmpty().withMessage('Subject is required')
        .isLength({ max: 200 }).withMessage('Subject cannot exceed 200 characters'),
    body('message')
        .trim()
        .notEmpty().withMessage('Message is required')
        .isLength({ max: 5000 }).withMessage('Message cannot exceed 5000 characters')
];

// POST /api/contact
// Applying rate limiter, input validation, and controller handler
router.post('/', contactLimiter, validateContactInput, submitContact);

module.exports = router;
