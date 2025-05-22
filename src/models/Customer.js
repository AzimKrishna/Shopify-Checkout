const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    street: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    is_default: {
        type: Boolean,
        default: false
    }
});

const customerSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true,
        match: /^\+?[1-9]\d{1,14}$/
    },
    addresses: [addressSchema],
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

customerSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model('Customer', customerSchema);