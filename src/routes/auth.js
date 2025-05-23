const express = require('express');
const AuthController = require('../controllers/authController');
const otpRateLimiter = require('../middleware/rateLimit');

const router = express.Router();

router.post('/otp/send', otpRateLimiter, AuthController.sendOTP);

module.exports = router;