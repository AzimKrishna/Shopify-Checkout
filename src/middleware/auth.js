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
        console.error(`JWT verification error: ${error.message}`);
        res.status(401).json({ error: { message: 'Invalid or expired token', status: 401 } });
    }
}

const authenticateSession = async(req, res, next) => {
    const token = req.cookies.session_token;

    if(!token){
        // Allow request to proceed if auth is optional for some routes (like getCheckout initially)
        // Or send 401 if auth is strictly required.
        // For /auth/status, we want it to proceed to tell frontend "not authenticated"
        if (req.path === '/status') return next();
        return res.status(401).json({ error: { message: 'Unauthorized: No session token', status: 401 } });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SESSION_SECRET || process.env.JWT_SECRET);
        if (decoded.role !== 'customer') {
            console.warn(`Invalid role in session token: ${decoded.role}`);
            return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
        }

        req.user = decoded; // Contains customer_id, phone, role
        req.customer_id = decoded.customer_id; // Keep for compatibility if other parts use it directly
        next();
    } catch (error) {
        console.error(`Session token verification error: ${error.message}`);
        // Clear the invalid cookie
        res.clearCookie('session_token', {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            secure: true,
            sameSite: 'None',
            path: '/',
            domain: '.serveo.net'
        });
        // For /auth/status, proceed to tell frontend "not authenticated"
        if (req.path === '/status') return next();
        return res.status(401).json({ error: { message: 'Invalid or expired session', status: 401 } });
    }
}

// module.exports = authenticateJWT;
module.exports = authenticateSession;