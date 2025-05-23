const express = require('express');
const PaymentController = require('../controllers/paymentController');
const authenticateJWT = require('../middleware/auth');

const router = express.Router();

router.post('/razorpay', authenticateJWT, PaymentController.createRazorpayOrder);

module.exports = router;