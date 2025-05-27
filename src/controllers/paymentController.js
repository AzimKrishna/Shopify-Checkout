const PaymentService = require('../services/paymentService');

class PaymentController{

    static async createRazorpayOrder(req, res, next) {
        try {
            const { checkout_id } = req.body;
            const customer_id = req.customer_id;

            const paymentData = await PaymentService.createRazorpayOrder(checkout_id, customer_id);
            res.status(200).json({
                message: 'Razorpay order created',
                ...paymentData
            });

        } catch (error) {
            next(error);
        }
    }

}

module.exports = PaymentController;