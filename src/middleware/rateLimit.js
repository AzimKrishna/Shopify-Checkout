const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { redisClient } = require('../config/redis');

const otpRateLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
    }),
    windowMs: 60*60*1000,
    max: 5,
    keyGenerator: (req) => req.body.phone || req.ip,
    handler: (req, res, next) => {
        console.warn(`Rate limit exceeded for phone: ${req.body.phone || req.ip}`);
        res.status(429).json({
            error: {
                message: 'Too many OTP requests, try again later',
                status: 429
            }
        });
    }
});

module.exports = otpRateLimiter;