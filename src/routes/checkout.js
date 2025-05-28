const express = require('express')
const CheckoutController = require('../controllers/checkoutController');
const authenticateSession = require('../middleware/auth');

const router = express.Router();

router.post('/initialize', CheckoutController.initializeCheckout);
router.patch('/update', authenticateSession, CheckoutController.updateCheckout);
router.post('/:checkout_id/discounts', CheckoutController.applyDiscount);
router.get('/:id', CheckoutController.getCheckout);

module.exports = router;