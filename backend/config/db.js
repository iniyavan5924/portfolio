/**
 * -------------------------------------------------------------
 * Database Connection Setup (MongoDB & Mongoose)
 * -------------------------------------------------------------
 */

const mongoose = require('mongoose');
const dns = require('dns');

// Configure Node.js to use Google's DNS servers to resolve MongoDB Atlas SRV DNS records reliably.
// This resolves the querySrv ECONNREFUSED error common on some networks/routers and Windows/Node.js configurations.
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    console.log('[Database] Configured DNS servers to Google DNS (8.8.8.8, 8.8.4.4) for Atlas SRV resolution.');
} catch (dnsErr) {
    console.warn(`[Database Warning] Failed to set custom DNS servers: ${dnsErr.message}`);
}

const connectDB = async () => {
    const primaryURI = process.env.MONGO_URI;
    console.log("URI =", primaryURI);
    const fallbackURI = 'mongodb://127.0.0.1:27017/portfolio';

    try {
        if (!primaryURI) {
            throw new Error('Primary MONGO_URI is not set in environment.');
        }
        const conn = await mongoose.connect(primaryURI, { family: 4, serverSelectionTimeoutMS: 2000 });
        console.log(`[Database] MongoDB Connected successfully (Primary): ${conn.connection.host}`);
    } catch (error) {
        console.error(`[Database] Error connecting to primary MongoDB: ${error.message}`);
        console.log('[Database Warning] Primary connection failed. Attempting fallback to local MongoDB for development...');
        try {
            const conn = await mongoose.connect(fallbackURI);
            console.log(`[Database] MongoDB Connected successfully (Fallback Local): ${conn.connection.host}`);
        } catch (fallbackError) {
            console.error(`[Database] Error connecting to fallback MongoDB: ${fallbackError.message}`);
            process.exit(1); // Exit process only if fallback also fails
        }
    }
};

module.exports = connectDB;
