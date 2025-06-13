const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAdmin } = require('../config/auth');

// Admin Panel
router.get('/dashboard', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.render('admin/dashboard', { user: req.user, title: 'Admin Dashboard' });
});

module.exports = router;