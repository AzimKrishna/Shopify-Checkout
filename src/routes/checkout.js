const express = require('express')
const CheckoutController = require('../controllers/checkoutController');

const router = express.Router();

router.post('/initialize', CheckoutController.initializeCheckout);

module.exports = router;