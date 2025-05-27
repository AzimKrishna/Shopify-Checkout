require('dotenv').config();
const express = require('express');
const errorMiddleware = require('./middleware/error');
const connectDB = require('./config/db');
const Merchant = require('./models/Merchant');
const Customer = require('./models/Customer');
const Checkout = require('./models/Checkout');
const { connectRedis } = require('./config/redis');
const orderQueue = require('./queues/orderQueue');
const Coupon = require('./models/Coupon');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

const startServer = async () => {
    try{

        connectDB();
        await connectRedis();

        const authRoutes = require('./routes/auth');
        const checkoutRoutes = require('./routes/checkout');
        const paymentRoutes = require('./routes/payment');
        const addressRoutes = require('./routes/addresses');

        app.use(express.json());

        app.use(cors({
            origin: '*', // allow your Shopify store
            methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
            credentials: true // if using cookies or authorization headers
        }));

        app.use('/api/v1/auth', authRoutes);
        app.use('/api/v1/checkout', checkoutRoutes);
        app.use('/api/v1/payment', paymentRoutes);
        app.use('/api/v1/addresses', addressRoutes);

        app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'OK',
                timestamp: new Date().toISOString()
            });
        });

        // Test endpoint for schemas
        app.post('/test-models', async (req, res, next) => {
            try {
                const merchant = await Merchant.create({
                    name: 'Test Store',
                    shopify_api_key: process.env.SHOPIFY_API_KEY,
                    shopify_api_secret: process.env.SHOPIFY_API_SECRET,
                    shopify_store_domain: process.env.SHOPIFY_STORE_DOMAIN,
                    shopify_access_token: process.env.SHOPIFY_ACCESS_TOKEN,
                    razorpay_key_id: process.env.RAZORPAY_KEY_ID,
                    razorpay_key_secret: process.env.RAZORPAY_KEY_SECRET,
                    razorpay_webhook_secret: 'test_webhook_secret',
                    textlocal_api_key: 'test_textlocal_key'
                });

                const customer = await Customer.create({
                    phone: '+919876543210',
                    addresses: [{
                        street: '123 Main St',
                        city: 'Mumbai',
                        state: 'Maharashtra',
                        pincode: '400001',
                        is_default: true
                    }]
                });

                const coupon = await Coupon.create({
                    code: "SAVE10",
                    merchant_id: merchant._id,
                    discount_type: "fixed",
                    discount_value: 10,
                    max_usage: 100,
                    expires_at: new Date("2025-12-31T23:59:59Z"),
                    used_count: 0,
                });

                const coupon2 = await Coupon.create({
                    code: "OFF20",
                    merchant_id: merchant._id,
                    discount_type: "percentage",
                    discount_value: 20,
                    max_usage: 50,
                    expires_at: new Date("2025-12-31T23:59:59Z"),
                    used_count: 0,
                });

                // const checkout = await Checkout.create({
                //     merchant_id: merchant._id,
                //     customer_id: customer._id,
                //     cart_items: [{
                //         item_id: 'prod_789',
                //         variant_id: 'var_101',
                //         quantity: 2,
                //         price: 100.00
                //     }],
                //     total: 200.00
                // });

                res.status(201).json({ merchant, customer });
            } catch (err) {
                next(err);
            }
        });

        app.post('/test-queue', async (req, res, next) => {
            try {
                const job = await orderQueue.add({
                    checkout_id: 'chk_987',
                    payment_status: 'success',
                    payment_id: 'pay_123'
                });
                res.status(201).json({ jobId: job.id, status: 'queued' });
            } catch (error) {
                next(error);
            }
        });


        // app.get('/error', (req, res, next) => {
        //     const err = new Error('Test erorr');
        //     err.status = 400;
        //     next(err);
        // })

        app.use(errorMiddleware);

        app.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });
    } catch(error){
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();