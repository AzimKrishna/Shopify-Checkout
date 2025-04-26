require('dotenv').config();
const express = require('express');
const errorMiddleware = require('./middleware/error');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// app.get('/error', (req, res, next) => {
//     const err = new Error('Test erorr');
//     err.status = 400;
//     next(err);
// })

app.use(errorMiddleware);

app.listen(port, ()=>{
    console.log(`Server listening on port ${port}`);
});