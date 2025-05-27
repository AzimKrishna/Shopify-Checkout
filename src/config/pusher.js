const Pusher = require('pusher');

if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_APP_KEY || !process.env.PUSHER_APP_SECRET || !process.env.PUSHER_APP_CLUSTER) {
    console.error("FATAL ERROR: Pusher environment variables are not fully set. Please check PUSHER_APP_ID, PUSHER_APP_KEY, PUSHER_APP_SECRET, and PUSHER_APP_CLUSTER.");
    process.exit(1); // Optionally exit if it's critical
    // Or, ensure pusher is not used if not configured
}

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_APP_KEY,
    secret: process.env.PUSHER_APP_SECRET,
    cluster: process.env.PUSHER_APP_CLUSTER,
    useTLS: true,
});

module.exports = pusher;