const mongoose = require('mongoose');
const addressSchema = require('./Customer').schema.path('addresses').schema; // Reuse embedded schema

const cartItemSchema = mongoose.Schema({
    item_id: {
        type: String,
        required: true
    },
    variant_id: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    product_name: { type: String, required: true }, // New
    image_url: { type: String }, // New, optional
});

const checkoutSchema = mongoose.Schema({
    merchant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
        required: true,
    },
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    cart_items: [cartItemSchema],
    shipping_address: addressSchema,
    razorpay_order_id: {
        type: String
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    coupon_code: {
        type: String,
        uppercase: true,
        trim: true
    },
    coupon_details: { // Store original coupon properties needed for Shopify
        type: { type: String, enum: ['fixed', 'percentage'] }, // Original type from Coupon model
        value: { type: Number }                               // Original value (e.g., 10 for fixed, 20 for 20%)
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    payment_status: {
        type: String,
        enum: ['pending', 'authorized', 'failed'],
        default: 'pending'
    },
    payment_id: {
        type: String
    },
    shopify_order_id: {
        type: String
      },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date
      }
});

checkoutSchema.index({ merchant_id: 1 });
checkoutSchema.index({ customer_id: 1 });

module.exports = mongoose.model('Checkout', checkoutSchema);