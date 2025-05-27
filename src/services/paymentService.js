const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const Merchant = require('../models/Merchant');
const Checkout = require('../models/Checkout');
const Customer = require('../models/Customer');

class PaymentService{
    static async createRazorpayOrder(checkout_id, customer_id){
        try {
            if (!mongoose.Types.ObjectId.isValid(checkout_id) || !mongoose.Types.ObjectId.isValid(customer_id) ) {
                throw new Error('Invalid ID format');
            }

            // Validate checkout
            const checkout = await Checkout.findById(checkout_id).populate('merchant_id'); // Populate merchant to get keys
            if (!checkout) {
                throw new Error('Checkout not found');
            }
            if (checkout.status !== 'pending') {
                throw new Error('Checkout is not in pending state');
            }
            if (!checkout.customer_id || checkout.customer_id.toString() !== customer_id) {
                throw new Error('Checkout not associated with customer');
            }
            if (!checkout.shipping_address) {
                throw new Error('Checkout missing shipping address');
            }

            // Get merchant Razorpay credentials
            const merchant = checkout.merchant_id; // This is now the populated merchant document
            if (!merchant || !merchant.razorpay_key_id || !merchant.razorpay_key_secret) {
                throw new Error('Merchant Razorpay credentials not found');
            }

            if (checkout.customer_id.toString() !== customer_id) {
                throw new Error('Checkout not associated with authenticated customer');
            }

            // Get customer phone for Razorpay prefill
            const customer = await Customer.findById(customer_id);
            if (!customer) {
                throw new Error('Customer not found');
            }

            // Create Razorpay order
            const razorpay = new Razorpay({
                key_id: merchant.razorpay_key_id,
                key_secret: merchant.razorpay_key_secret
            });

            const order = await razorpay.orders.create({
                amount: Math.round(checkout.total * 100), // Convert to paise
                currency: 'INR',
                receipt: `chk_${checkout_id}`,
                notes: {
                    merchant_id: merchant._id.toString(), // Use the derived merchant._id
                    customer_id,
                    checkout_id
                }
            });

            // Update checkout with Razorpay order ID
            checkout.razorpay_order_id = order.id;
            checkout.updated_at = Date.now();
            await checkout.save();

            console.log(`Razorpay order created: ${order.id} for checkout ${checkout_id}`);
            return {
                order_id: order.id,
                razorpay_key_id: merchant.razorpay_key_id,
                amount: checkout.total,
                currency: 'INR',
                customer_phone: customer.phone
            };
        } catch (err) {
            console.error(`Razorpay order creation error: ${err.message}`);
            throw err;
        }
    }

}

module.exports = PaymentService;