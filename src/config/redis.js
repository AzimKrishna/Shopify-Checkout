const { createClient } = require('redis');
const logger = require('../utils/logger');

const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on('connect', ()=> {
    console.log('Redis connected successfully');
});

redisClient.on('error', (err) => {
    console.error(`Redis error: ${err.message}`);
})

const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error(`Redis connection error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { redisClient, connectRedis };