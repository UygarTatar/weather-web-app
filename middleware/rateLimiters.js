const rateLimit = require('express-rate-limit');

const usersLimiter = rateLimit ({
    windowMs: 10 * 60 * 1000,
    max: 30,
    message: 'Too many requests. Please try again 10 minutes later.',
    standardHeaders: true,
    legacyHeaders: false
});

const apiLimiter = rateLimit ({
    windowMs: 15 * 60 * 1000,
    max: 400,
    message: 'API request limit exceeded. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

const loginLimiter = rateLimit ({
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: 'Too many login attempts. Please try again in 10 minutes.',
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = { usersLimiter, apiLimiter, loginLimiter };