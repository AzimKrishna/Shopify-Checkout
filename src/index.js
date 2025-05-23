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

        app.use(express.json());

        app.use('/api/v1/auth', authRoutes);

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
                    shopify_api_key: 'test_shopify_key',
                    shopify_access_token: 'test_shopify_token',
                    razorpay_key_id: 'test_razorpay_id',
                    razorpay_key_secret: 'test_razorpay_secret',
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

                const checkout = await Checkout.create({
                    merchant_id: merchant._id,
                    customer_id: customer._id,
                    cart_items: [{
                        item_id: 'prod_789',
                        variant_id: 'var_101',
                        quantity: 2,
                        price: 100.00
                    }],
                    total: 200.00
                });

                res.status(201).json({ merchant, customer, checkout });
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