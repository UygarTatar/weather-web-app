const tokenService = require('../services/tokenService');
const User = require('../models/User');

function verifyAccessToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = tokenService.verifyAccessToken(token);

        // Get user from database then attach to request
        req.user = { id: payload.id, email: payload.email };
        
        next();
    } catch (err) {
        console.error('Access token verification failed:', err.message);
        return res.status(403).json({ message: 'Invalid or expired access token' });
    }
}

function ensureAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', 'Please log in to view this resource');
    res.redirect('/users/login');
}

function ensureAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.userType === 'Admin') {
        return next();
    }
    req.flash('error_msg', 'You do not have permission to view that page');
    res.redirect('/users/login');
}

module.exports = {
    verifyAccessToken,
    ensureAuthenticated,
    ensureAdmin
}