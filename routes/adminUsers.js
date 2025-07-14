const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const User = require('../models/User');

// List Users with Filters
router.get('/', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const { username, userType, status, defaultCityName } = req.query;
        const filter = {};
        if (username) filter.username = { $regex: new RegExp(username, 'i') };
        if (userType) filter.userType = userType;
        if (status) filter.status = status;
        if (defaultCityName) filter.defaultCityName = { $regex: new RegExp(defaultCityName, 'i') };

        const users = await User.find(filter).sort({ userType: 1, createdAt: -1 });
        res.render('admin/users', {
            users,
            user: req.user,
            page: 'users',
            title: "User Management",
            query: req.query
        });
    } catch (err) {
        console.error(err);
        res.send("An error occurred");
    }
});

// Delete User
router.post('/delete/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash('error_msg', 'User not found.');
        } else if (user.userType === 'Admin') {
            req.flash('error_msg', 'Admin users cannot be deleted.');
        } else {
            await User.findByIdAndDelete(req.params.id);
            req.flash('success_msg', 'User deleted.');
        }
        res.redirect('/admin/users');
    } catch (err) {
        console.log(err);
        req.flash('error_msg', 'Error deleting user.');
        res.redirect('/admin/users');
    }
});

module.exports = router;