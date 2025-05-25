const mongoose = require("mongoose");
const Merchant = require("../models/Merchant");
const crypto = require('crypto');
const Checkout = require("../models/Checkout");
const orderQueue = require("../queues/orderQueue");


class WebhookService {
    static async processRazorpayWebhook(payload, signature, merchant_id) {
        try {
            if (!mongoose.Types.ObjectId.isValid(merchant_id)) {
                throw new Error('Invalid Merchant Id');
            }

            const merchant = await Merchant.findById(merchant_id);
            if (!merchant || !merchant.razorpay_webhook_secret) {
                throw new Error('Merchant or webhook secret not found');
            }

            const generatedSignature = crypto
                .createHmac('sha256', merchant.razorpay_webhook_secret)
                .update(JSON.stringify(payload))
                .digest('hex');

            if (generatedSignature !== signature) {
                throw new Error('Invalid webhook signature');
            }

            const event = payload.event;
            const payment = payload.payload.payment.entity;
            const orderId = payment.order_id;

            const checkout = await Checkout.findOne({
                razorpay_order_id: orderId
            });
            if (!checkout) {
                throw new Error('Checkout not found for order ID');
            }
            if (checkout.merchant_id.toString() !== merchant_id) {
                throw new Error('Checkout does not belong to merchant');
            }

            // Idempotency: Skip if payment_id already processed
            if (checkout.payment_id === payment.id) {
                console.log(`Webhook already processed for payment ${payment.id}`);
                return { status: 'skipped', checkout_id: checkout._id };
            }

            if (event === 'payment.authorized') {
                checkout.payment_status = 'authorized';
                checkout.payment_id = payment.id;
                checkout.status = 'completed';
                checkout.updated_at = Date.now();
                await checkout.save();

                // Queue order creation
                await orderQueue.add({
                    checkout_id: checkout._id,
                    payment_status: 'authorized',
                    payment_id: payment.id
                });

                console.log(`Payment authorized for checkout ${checkout._id}, order queued`);
                return { status: 'processed', checkout_id: checkout._id };
            } else if (event === 'payment.failed') {
                checkout.payment_status = 'failed';
                checkout.payment_id = payment.id;
                checkout.status = 'failed';
                checkout.updated_at = Date.now();
                await checkout.save();

                console.log(`Payment failed for checkout ${checkout._id}`);
                return { status: 'processed', checkout_id: checkout._id };
            } else {
                console.warn(`Unsupported webhook event: ${event}`);
                return { status: 'ignored', checkout_id: checkout._id };
            }

        } catch (error) {
            console.error(`Webhook processing error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = WebhookService;