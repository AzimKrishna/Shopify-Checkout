const express = require('express');
const AuthController = require('../controllers/authController');
const otpRateLimiter = require('../middleware/rateLimit');

const router = express.Router();

router.post('/otp/send', otpRateLimiter, AuthController.sendOTP);
router.post('/otp/verify', AuthController.verifyOTP);

module.exports = router;