const mongoose = require('mongoose');
const Merchant = require('../models/Merchant');
const Checkout = require('../models/Checkout');


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
}

module.exports = CheckoutService;