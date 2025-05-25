const express = require('express');
const PaymentController = require('../controllers/paymentController');
const WebhookController = require('../controllers/webhookController');
const authenticateJWT = require('../middleware/auth');

const router = express.Router();

router.post('/razorpay', authenticateJWT, PaymentController.createRazorpayOrder);
router.post('/webhook', WebhookController.handleRazorpayWebhook);

module.exports = router;