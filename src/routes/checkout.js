const express = require('express')
const CheckoutController = require('../controllers/checkoutController');
const authenticateJWT = require('../middleware/auth');

const router = express.Router();

router.post('/initialize', CheckoutController.initializeCheckout);
router.patch('/update', authenticateJWT, CheckoutController.updateCheckout);

module.exports = router;