const Queue = require('bull');

const queueName = 'order-queue';
const redisUrl = process.env.REDIS_URL;

const orderQueue = new Queue(queueName, redisUrl);

orderQueue.process(async (job) => {
    const { checkout_id, payment_status, payment_id } = job.data;
    console.log(`Processing order job: ${JSON.stringify(job.data) }`);

    return { checkout_id, status: 'processed' };
});

orderQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed: ${JSON.stringify(result)}`);
});

orderQueue.on('failed', (job, err) =>{
    console.error(`Job ${job.id} failed: ${err.message}`);
})

module.exports = orderQueue;