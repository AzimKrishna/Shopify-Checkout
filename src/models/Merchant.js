const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encrypt');

const merchantSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    shopify_api_key: {
        type: String,
        required: true,
        get: decrypt,
        set: encrypt
    },
    shopify_access_token: {
        type: String,
        required: true,
        get: decrypt,
        set: encrypt
    },
    razorpay_key_id: {
        type: String,
        required: true,
        get: decrypt,
        set: encrypt
    },
    razorpay_key_secret: {
        type: String,
        required: true,
        get: decrypt,
        set: encrypt
    },
    textlocal_api_key: {
        type: String,
        required: true,
        get: decrypt,
        set: encrypt
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
})

merchantSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

merchantSchema.set('toJSON', { getters: true });
merchantSchema.set('toObject', { getters: true });
merchantSchema.index({ shopify_api_key: 1 });

module.exports = mongoose.model('Merchant', merchantSchema);