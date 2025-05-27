const { default: mongoose } = require("mongoose");
const Checkout = require("../models/Checkout");
const Merchant = require("../models/Merchant");
const Customer = require("../models/Customer");
const ShopifyApiNode = require('shopify-api-node'); // Import the library
const Coupon = require("../models/Coupon");


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

            // --- Phone Number Handling ---
            let shopifyCustomerPhone = customer.phone; // This should now be E.164 (e.g., +91...)

            // You might still want a simple validation or logging
            if (!shopifyCustomerPhone || !/^\+[1-9]\d{1,14}$/.test(shopifyCustomerPhone)) {
                console.warn(`Customer phone '${shopifyCustomerPhone}' is not in expected E.164 format. Proceeding, but Shopify might reject.`);
                // Potentially throw an error if strict E.164 is required by your logic here
            }

            // Initialize Shopify API client for this merchant
            const shopify = new ShopifyApiNode({
                shopName: merchant.shopify_store_domain.replace('.myshopify.com', ''), // shopify-api-node expects just the shop name part
                accessToken: merchant.shopify_access_token,
                apiVersion: '2024-04' // Specify your desired API version
            });

            let customerPayloadForShopify;

            try {
                const existingShopifyCustomers = await shopify.customer.search({ query: `phone:${shopifyCustomerPhone}` });
                if (existingShopifyCustomers && existingShopifyCustomers.length > 0) {
                    customerPayloadForShopify = { id: existingShopifyCustomers[0].id };
                    console.log(`OrderService: Found existing Shopify customer ID ${existingShopifyCustomers[0].id} for phone ${shopifyCustomerPhone}`);
                } else {
                    customerPayloadForShopify = {
                        phone: shopifyCustomerPhone,
                        first_name: checkout.shipping_address.first_name || customer.first_name || 'Valued',
                        last_name: checkout.shipping_address.last_name || customer.last_name || 'Customer',
                        // email: customer.email, // If you collect email and want to send it
                    };
                    console.log(`OrderService: No Shopify customer found for phone ${shopifyCustomerPhone}. Shopify will attempt to create one.`);
                }
            } catch (customerSearchError) {
                console.warn(`OrderService: Error searching for Shopify customer by phone ${shopifyCustomerPhone}: ${customerSearchError.message}. Falling back to customer creation data.`);
                customerPayloadForShopify = { // Fallback data
                    phone: shopifyCustomerPhone,
                    first_name: checkout.shipping_address.first_name || customer.first_name || 'Valued',
                    last_name: checkout.shipping_address.last_name || customer.last_name || 'Customer',
                };
            }

            const lineItems = checkout.cart_items.map(item => ({
                variant_id: item.variant_id,
                quantity: item.quantity,
                // price: item.price
            }));

            const orderDataPayload = {
                line_items: lineItems,
                customer: customerPayloadForShopify,
                shipping_address: {
                    first_name: checkout.shipping_address.first_name || customer.first_name || 'Valued', // Placeholder if not available
                    last_name: checkout.shipping_address.last_name || customer.last_name || 'Customer',   // Placeholder
                    address1: checkout.shipping_address.street,
                    city: checkout.shipping_address.city,
                    province: checkout.shipping_address.state,
                    zip: checkout.shipping_address.pincode,
                    country_code: 'IN',
                },
                financial_status: 'paid',
                currency: 'INR',
                transactions: [{
                    kind: 'sale',
                    status: 'success',
                    amount: checkout.total.toFixed(2), // This should be the final discounted amount
                    gateway: 'Custom Checkout Razorpay',
                    authorization: checkout.payment_id,
                }],
                note: `Checkout ID: ${checkout_id}. Razorpay Payment ID: ${payment_id}. Processed by Custom Checkout Service.`,
                send_receipt: true,
            };

            // Use the stored original coupon details
            if (checkout.coupon_code && checkout.coupon_details && checkout.discount > 0) {
                orderDataPayload.discount_codes = [{
                    code: checkout.coupon_code,
                    amount: checkout.coupon_details.value.toString(), // This is the original rate/fixed value
                    type: checkout.coupon_details.type === 'fixed' ? 'fixed_amount' : 'percentage'
                }];
            }

            console.log(`OrderService (shopify-api-node): Creating Shopify order for ${merchant.shopify_store_domain} with payload: ${JSON.stringify(orderDataPayload, null, 2)}`);

            const shopifyOrder = await shopify.order.create(orderDataPayload);

            if (!shopifyOrder || !shopifyOrder.id) {
                console.error(`Shopify order creation response missing order or order.id for ${merchant.shopify_store_domain}:`, shopifyOrder);
                throw new Error('Failed to create Shopify order or retrieve order ID from Shopify.');
            }

            checkout.shopify_order_id = shopifyOrder.id.toString();
            checkout.shopify_order_id = shopifyOrder.id;
            checkout.updated_at = Date.now();
            await checkout.save();

            console.log(`Shopify order created: ${shopifyOrder.id} for checkout ${checkout_id}`);
            return { status: 'created', shopify_order_id: shopifyOrder.id };
        } catch (err) {
            console.error(`OrderService (shopify-api-node): Shopify order creation error for checkout ${checkout_id}. Message: ${err.message}`);
            if (err.response && err.response.body && err.response.body.errors) {
                console.error('OrderService (shopify-api-node): Detailed Shopify Error:', JSON.stringify(err.response.body.errors, null, 2));
            } else if (err.errors) { // Sometimes errors are directly on the err object
                console.error('OrderService (shopify-api-node): Detailed Shopify Error (err.errors):', JSON.stringify(err.errors, null, 2));
            }
            // console.error('SaaS OrderService: Full error object:', err); // For very detailed debugging
            throw new Error(`Failed to create Shopify order for checkout ${checkout_id}: ${err.message}`);
        }
    }

}

module.exports = OrderService;