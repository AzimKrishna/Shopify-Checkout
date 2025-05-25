const Queue = require('bull');

const queueName = 'order-queue';
const redisUrl = process.env.REDIS_URL;

const orderQueue = new Queue(queueName, redisUrl);

orderQueue.process(async (job) => {
    try {
        console.log(`Processing order creation for checkout ${job.data.checkout_id}`);
        // Placeholder: Task 6.1 will implement order creation
        return { status: 'processed', checkout_id: job.data.checkout_id };
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