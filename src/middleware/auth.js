const jwt = require('jsonwebtoken');

const authenticateJWT = async(req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer ')){
            console.warn('Missing or invalid Authorization header');
            return res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(decoded.role !== 'customer'){
            console.warn(`Invalid role for token: ${decoded.role}`);
            return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
        }


        req.customer_id = decoded.customer_id;
        next();
    } catch (error) {
        console.error(`JWT verification error: ${err.message}`);
        res.status(401).json({ error: { message: 'Invalid or expired token', status: 401 } });
    }
}

module.exports = authenticateJWT;