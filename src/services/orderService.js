const { default: mongoose } = require("mongoose");
const Checkout = require("../models/Checkout");
const Merchant = require("../models/Merchant");
const Customer = require("../models/Customer");
const { Shopify } = require('@shopify/shopify-api');

class OrderService{

    static async createShopifyOrder(checkout_id, payment_status, payment_id){
        try {
            if(!mongoose.Types.ObjectId.isValid(checkout_id)){
                throw new Error('Invalid Checkout Id');
            }
            if (payment_status !== 'authorized') {
                throw new Error('Payment not authorized');
            }

            const checkout = await Checkout.findById(checkout_id);
            if (!checkout) {
                throw new Error('Checkout not found');
            }

            if (checkout.status !== 'completed' || checkout.payment_status !== 'authorized' || checkout.payment_id !== payment_id) {
                throw new Error('Invalid checkout state for order creation');
            }
            if (!checkout.customer_id || !checkout.shipping_address) {
                throw new Error('Checkout missing customer or shipping address');
            }
            if (checkout.shopify_order_id) {
                console.log(`Order already created for checkout ${checkout_id}`);
                return { status: 'skipped', shopify_order_id: checkout.shopify_order_id };
            }

            const merchant = await Merchant.findById(checkout.merchant_id);
            if (!merchant || !merchant.shopify_api_key || !merchant.shopify_access_token || !merchant.shopify_store_domain) {
                throw new Error('Merchant Shopify credentials not found');
            }
            const customer = await Customer.findById(checkout.customer_id);
            if (!customer) {
                throw new Error('Customer not found');
            }

            const shopify = new Shopify.Clients.Rest(
                merchant.shopify_store_domain,
                merchant.shopify_access_token
            );

            const lineItems = checkout.cart_items.map(item => ({
                variant_id: item.variant_id,
                quantity: item.quantity,
                price: item.price
              }));

            // Create Shopify order
            const orderResponse = await shopify.post({
                path: 'orders',
                data: {
                    order: {
                        line_items: lineItems,
                        customer: {
                            phone: customer.phone
                        },
                        shipping_address: {
                            address1: checkout.shipping_address.street,
                            city: checkout.shipping_address.city,
                            province: checkout.shipping_address.state,
                            zip: checkout.shipping_address.pincode,
                            country: 'IN'
                        },
                        financial_status: 'paid',
                        total_price: checkout.total,
                        currency: 'INR',
                        transactions: [{
                            kind: 'sale',
                            status: 'success',
                            amount: checkout.total,
                            gateway: 'razorpay',
                            payment_id: checkout.payment_id
                        }],
                        note: `Checkout ID: ${checkout_id}, Razorpay Payment ID: ${payment_id}`
                    }
                }
            });

            const shopifyOrder = orderResponse.body.order;
            checkout.shopify_order_id = shopifyOrder.id;
            checkout.updated_at = Date.now();
            await checkout.save();

            console.log(`Shopify order created: ${shopifyOrder.id} for checkout ${checkout_id}`);
            return { status: 'created', shopify_order_id: shopifyOrder.id };
        } catch (err) {
            console.error(`Shopify order creation error: ${err.message}`);
            throw err;
          }
    }

}

module.exports = OrderService;