const express = require('express');
const AuthController = require('../controllers/authController');
const otpRateLimiter = require('../middleware/rateLimit');
const authenticateSession = require('../middleware/auth'); // Renaming for clarity

const router = express.Router();

router.post('/otp/send', otpRateLimiter, AuthController.sendOTP);
router.post('/otp/verify', AuthController.verifyOTP);
router.get('/status', authenticateSession, AuthController.authStatus); // NEW - uses auth middleware
router.post('/logout', authenticateSession, AuthController.logout);    // NEW - uses auth middleware

module.exports = router;