/**
 * -------------------------------------------------------------
 * Main Entry Point - Portfolio Backend Server
 * -------------------------------------------------------------
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const contactRoutes = require('./routes/contactRoutes');
const errorHandler = require('./middleware/errorHandler');

// Initialize express app
const app = express();

// Connect to MongoDB Atlas
connectDB();

// 1. Security headers setup (Helmet)
app.use(helmet());

// 2. CORS Configuration (Allows restricted origins to perform API calls)
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:8080',
            'http://127.0.0.1:8080',
            'http://localhost:8080'
        ];
        // Allow if no origin (e.g. server-to-server/cURL) or if matched in whitelist, or in development mode
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS policy'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 3. Request body JSON parser middleware
app.use(express.json());

// 4. API Routes Mounting
app.use('/api/contact', contactRoutes);

// 5. Base Route (Health Check / Diagnostic)
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Portfolio Contact API is running. Production-ready.'
    });
});

// 6. 404 Route handler for unregistered paths
app.use((req, res, next) => {
    res.status(404);
    next(new Error(`API Route Not Found - ${req.originalUrl}`));
});

// 7. Global Exception Handler Middleware
app.use(errorHandler);

// Define running port and start server listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`[Server] Portfolio backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});
