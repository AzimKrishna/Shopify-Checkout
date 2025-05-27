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

    static async getCheckout(req, res, next) {
        try {
            const { id: checkout_id } = req.params;
            const checkout = await CheckoutService.getCheckout(checkout_id);

            res.status(200).json({
                checkout_id: checkout._id,
                merchant_id: checkout.merchant_id,
                cart_items: checkout.cart_items,
                coupon_code: checkout.coupon_code,
                discount: checkout.discount,
                total: checkout.total,
                status: checkout.status,
                shipping_address: checkout.shipping_address,
                created_at: checkout.created_at,
                modified_at: checkout.updated_at || checkout.created_at
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateCheckout(req, res, next){
        try {
            const { checkout_id, shipping_address, save_to_customer = true } = req.body;
            const customer_id = req.customer_id;
            const checkout = await CheckoutService.updateCheckout(checkout_id, customer_id, shipping_address, save_to_customer);
            res.status(200).json({ message: 'Checkout updated', checkout_id: checkout._id });

        } catch (error) {
            next(error);
        }
    }

    static async applyDiscount(req, res, next) {
        try {
            const { checkout_id } = req.params;
            const { discount_code } = req.body;
            const checkout = await CheckoutService.applyDiscount(checkout_id, discount_code);
            res.status(200).json({
                checkout_id: checkout._id,
                merchant_id: checkout.merchant_id,
                items: checkout.cart_items,
                coupon_code: checkout.coupon_code,
                discount: checkout.discount,
                total: checkout.total,
                status: checkout.status,
                created_at: checkout.created_at,
                modified_at: checkout.updated_at || checkout.created_at
            })
        } catch (error) {
            res.status(400).json({
                error: error.message,
              });
        }
    }
}

module.exports = CheckoutController;