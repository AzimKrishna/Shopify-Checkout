const Queue = require('bull');
const OrderService = require('../services/orderService');
const queueName = 'order-queue';
const redisUrl = process.env.REDIS_URL;

const orderQueue = new Queue(queueName, redisUrl);

orderQueue.process(async (job) => {
    try {
        const { checkout_id, payment_status, payment_id } = job.data;
        console.log(`Processing order creation for checkout ${checkout_id}`);
        const result = await OrderService.createShopifyOrder(checkout_id, payment_status, payment_id);
        return result;
    } catch (err) {
        console.log(`Order creation error: ${err.message}`);
        throw err;
    }
});

orderQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed: ${JSON.stringify(result)}`);
});

orderQueue.on('failed', (job, err) =>{
    console.error(`Job ${job.id} failed: ${err.message}`);
})

module.exports = orderQueue;