const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    first_name:{
        type: String,
    },
    last_name:{
        type: String,
    },
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
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
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
    this.updated_at = Date.now();
    // Ensure only one default address
    if (this.addresses.some((addr) => addr.is_default)) {
        this.addresses.forEach((addr) => {
            if (this.addresses.filter((a) => a.is_default).length > 1) {
                addr.is_default = false;
            }
        });
    }
    next();
});

module.exports = mongoose.model('Customer', customerSchema);