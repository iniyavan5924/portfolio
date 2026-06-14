/**
 * -------------------------------------------------------------
 * Database Connection Setup (MongoDB & Mongoose)
 * -------------------------------------------------------------
 */

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);
    } catch (error) {
        console.error(`[Database] Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Exit process with failure code
    }
};

module.exports = connectDB;
