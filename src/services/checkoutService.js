const mongoose = require('mongoose');
const Merchant = require('../models/Merchant');
const Checkout = require('../models/Checkout');
const Customer = require('../models/Customer');
const CouponService = require('./couponService');
const ShopifyApiNode = require('shopify-api-node');

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

            const shopify = new ShopifyApiNode({
                shopName: merchant.shopify_store_domain.replace('.myshopify.com', ''), // shopify-api-node expects just the shop name part
                accessToken: merchant.shopify_access_token,
                apiVersion: '2024-04' // Specify your desired API version
            });

            // Fetch product details for each item
            const enrichedItems = await Promise.all(cart_items.map(async (item) => {
                try {
                    const product = await shopify.product.get(item.item_id);
                    const variant = product.variants.find(v => v.id.toString() === item.variant_id);
                    return {
                        ...item,
                        product_name: product.title,
                        image_url: product.image?.src || variant?.image?.src || null,
                    };
                } catch (err) {
                    console.error(`Failed to fetch product ${item.item_id}:`, err);
                    return {
                        ...item,
                        product_name: `Unknown Product (ID: ${item.item_id})`,
                        image_url: null,
                    };
                }
            }));
            

            const checkout = await Checkout.create({
                merchant_id,
                cart_items: enrichedItems,
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

    static async updateCheckout(checkout_id, customer_id, shipping_address, save_to_customer){
        try {
            if (!mongoose.Types.ObjectId.isValid(checkout_id) || !mongoose.Types.ObjectId.isValid(customer_id)) {   
                throw new Error('Invalid ID format');
            } 

            const checkout = await Checkout.findById(checkout_id);
            if (!checkout) {
                throw new Error('Checkout not found');
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

    static async applyDiscount(checkout_id, coupon_code){
        try {
            if(!mongoose.Types.ObjectId.isValid(checkout_id)){
                throw new Error('Invalid checkout ID');
            }

            const checkout = await Checkout.findById(checkout_id);
            if (!checkout) {
                throw new Error('Checkout not found');
            }
            const merchant_id_from_checkout = checkout.merchant_id;
            if (checkout.status !== 'pending') {
                throw new Error('Checkout is not in pending state');
            }

            await CouponService.applyCoupon(checkout, coupon_code, merchant_id_from_checkout);
            await checkout.save();
            console.log(`Discount applied to checkout: ${checkout._id}`);
            return checkout;
        } catch (error) {
            console.error(`Discount application error: ${error.message}`);
            throw error;
        }
    }

    static async getCheckout(checkout_id){
        try {
            if (!mongoose.Types.ObjectId.isValid(checkout_id)) {
                throw new Error('Invalid Checkout ID format');
            }
            const checkout = await Checkout.findById(checkout_id).populate('merchant_id'); // Optionally populate merchant if needed immediately
            if (!checkout) {
                throw new Error('Checkout not found');
            }

            return checkout;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = CheckoutService;