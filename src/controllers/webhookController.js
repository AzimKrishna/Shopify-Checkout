const WebhookService = require('../services/webhookService');

class WebhookController{
    static async handleRazorpayWebhook(req, res, next){
        try {
            const payload = req.body;
            const signature = req.headers['x-razorpay-signature'];
            const merchant_id = req.query.merchant_id; // Passed in webhook URL

            const result = await WebhookService.processRazorpayWebhook(payload, signature, merchant_id);
            res.status(200).json({ status: result.status, checkout_id: result.checkout_id });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = WebhookController;