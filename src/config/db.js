const mongoose = require('mongoose');
const logger = require('../utils/logger');

const dbUrl = process.env.MONGO_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(dbUrl);
        console.log('MongoDB connected!');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}


module.exports = connectDB;