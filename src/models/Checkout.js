const mongoose = require('mongoose');

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
    }
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
    total: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    payment_id: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

checkoutSchema.index({ merchant_id: 1 });
checkoutSchema.index({ customer_id: 1 });

module.exports = mongoose.model('Checkout', checkoutSchema);