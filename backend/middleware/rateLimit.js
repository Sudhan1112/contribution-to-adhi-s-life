const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50, // limit each IP to 50 login attempts per windowMs
    message: { error: 'Too many login attempts, please try again after 1 minute' }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again after 15 minutes' }
});

module.exports = { loginLimiter, apiLimiter };