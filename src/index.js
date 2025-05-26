require('dotenv').config();
const express = require('express');
const errorMiddleware = require('./middleware/error');
const connectDB = require('./config/db');
const Merchant = require('./models/Merchant');
const Customer = require('./models/Customer');
const Checkout = require('./models/Checkout');
const { connectRedis } = require('./config/redis');
const orderQueue = require('./queues/orderQueue');

const app = express();
const port = process.env.PORT || 3000;

const startServer = async () => {
    try{

        connectDB();
        await connectRedis();

        const authRoutes = require('./routes/auth');
        const checkoutRoutes = require('./routes/checkout');
        const paymentRoutes = require('./routes/payment');

        app.use(express.json());

        app.use('/api/v1/auth', authRoutes);
        app.use('/api/v1/checkout', checkoutRoutes);
        app.use('/api/v1/payment', paymentRoutes);

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
                    shopify_api_key: '20d1ba1f2dbfe5b58d2812e3d9c6286e',
                    shopify_store_domain: '',
                    shopify_access_token: '20a3bcc11d47a5d40e4304351e5b474c',
                    razorpay_key_id: 'rzp_test_lJ8yC3OtL6fpkQ',
                    razorpay_key_secret: 'szf6CQmpZpHjtyqUSIIanMnk',
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