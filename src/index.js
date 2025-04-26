const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

app.listen(port, ()=>{
    console.log(`Server listening on port ${port}`);
});