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

    static async updateCheckout(req, res, next){
        try {
            const { checkout_id, merchant_id, shipping_address, save_to_customer = true } = req.body;
            const customer_id = req.customer_id;
            const checkout = await CheckoutService.updateCheckout(checkout_id, customer_id, merchant_id, shipping_address, save_to_customer);
            res.status(200).json({ message: 'Checkout updated', checkout_id: checkout._id });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = CheckoutController;