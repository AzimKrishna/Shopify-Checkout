require('dotenv').config();
const winston = require('winston');
require('winston-mongodb');

class Logger{
    static logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
            new winston.transports.File({ filename: 'logs/combined.log' }),
            // new winston.transports.MongoDB({
            //     db: process.env.MONGO_URI,
            //     collection: 'logs',
            //     level: 'error',
            // })
        ]
    });
}

module.exports = Logger;