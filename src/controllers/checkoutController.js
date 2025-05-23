const CheckoutService = require('../services/checkoutService');

class CheckoutController {
    static async initializeCheckout(req, res, next){
        try {
            const { merchant_id, cart_items, total } = req.body;
            const checkout = await CheckoutService.initializeCheckout(merchant_id, cart_items, total);
            const iframe_url = `${process.env.CHECKOUT_BASE_URL}/checkout/${checkout._id}`;
            res.status(201).json({
                checkout_id: checkout._id,
                iframe_url
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = CheckoutController;