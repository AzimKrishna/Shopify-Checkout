const Logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
        Logger.logger.error({
            message: err.message,
            stack: err.stack,
            method: req.method,
            url: req.url,
            ip: req.ip
        });

        const status = err.status || 500;
        res.status(status).json({
            error: {
                message: err.message || "Internal server error.",
                status
            }
        });
};

module.exports = errorMiddleware;