const mongoose = require('mongoose');
const Merchant = require('../models/Merchant');
const Checkout = require('../models/Checkout');
const Customer = require('../models/Customer');


class CheckoutService{
    static async initializeCheckout(merchant_id, cart_items, total){
        try{
            if(!mongoose.Types.ObjectId.isValid(merchant_id)){
                throw new Error('Invalid Merchant Id');
            }

            const merchant = await Merchant.findById(merchant_id);
            if(!merchant){
                throw new Error('Merchant not found');
            }

            if(!Array.isArray(cart_items) || cart_items.length === 0){
                throw new Error('Cart items must be a non-empty array');
            }

            for(const item of cart_items){
                if(!item.item_id || !item.variant_id || !Number.isInteger(item.quantity)){
                    throw new Error('Invalid cart item format');
                }
            }

            if(typeof total !== 'number' || total < 0){
                throw new Error('Invalid total amount');
            }

            const calculatedTotal = cart_items.reduce((sum, item) => sum + item.quantity * item.price, 0);
            if(Math.abs(calculatedTotal - total) > 0.01){
                throw new Error('Total does not match cart items');
            }

            const checkout = await Checkout.create({
                merchant_id,
                cart_items,
                total,
                status: 'pending'
            });

            console.log(`Checkout initialized: ${checkout._id} for merchant ${merchant_id}`);
            return checkout;
        } catch(error){
            console.error(`Checkout initialization error: ${error.message}`);
            throw error;
        }
    }

    static async updateCheckout(checkout_id, customer_id, merchant_id, shipping_address, save_to_customer){
        try {
            if (!mongoose.Types.ObjectId.isValid(checkout_id) || !mongoose.Types.ObjectId.isValid(customer_id) || !mongoose.Types.ObjectId.isValid(merchant_id)) {   
                throw new Error('Invalid ID format');
            } 

            const checkout = await Checkout.findById(checkout_id);
            if (!checkout) {
                throw new Error('Checkout not found');
            }
            if (checkout.merchant_id.toString() !== merchant_id) {
                throw new Error('Checkout does not belong to merchant');
            }
            if (checkout.status !== 'pending') {
                throw new Error('Checkout is not in pending state');
            }

            // Validate shipping address
            if (!shipping_address || typeof shipping_address !== 'object') {
                throw new Error('Invalid shipping address');
            }
            const { street, city, state, pincode } = shipping_address;
            if (!street || !city || !state || !pincode) {
                throw new Error('Missing required address fields');
            }
            if (typeof pincode !== 'string' || !/^\d{6}$/.test(pincode)) {
                throw new Error('Invalid pincode format');
            }

            // Update customer addresses if requested
            if (save_to_customer) {
                const customer = await Customer.findById(customer_id);
                if (!customer) {
                    throw new Error('Customer not found');
                }
                customer.addresses.push({
                    street,
                    city,
                    state,
                    pincode,
                    is_default: customer.addresses.length === 0 // Default if first address
                });
                await customer.save();
                console.log(`Address saved to customer ${customer_id}`);
            }

            checkout.customer_id = customer_id;
            checkout.shipping_address = shipping_address;
            checkout.updated_at = Date.now();
            await checkout.save();
            console.log(`Checkout updated: ${checkout_id} for customer ${customer_id}`);
            return checkout;
        }catch (error){
            throw error;
        }
    }
}

module.exports = CheckoutService;