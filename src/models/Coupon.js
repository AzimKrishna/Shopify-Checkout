const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    merchant_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
        required: true
    },
    discount_type:{
        type: String,
        enum: ['fixed', 'percentage'],
        required: true
    },
    discount_value:{
        type: Number,
        required: true,
        min: 0
    },
    max_usage:{
        type: Number,
        required: true,
        min: 1
    },
    used_count:{
        type: Number,
        default: 0,
        min: 0
    },
    expires_at: {
        type: Date,
        required: true
    },
    created_at:{
        type: Date,
        default: Date.now
    }
});

CouponSchema.index({ code: 1, merchant_id: 1 }, { unique: true });

module.exports = mongoose.model('Coupon', CouponSchema);