const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// Admin Panel
router.get('/dashboard', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.render('admin/dashboard', { user: req.user, page: 'admin_dashboard', title: 'Admin Dashboard' });
});

module.exports = router;