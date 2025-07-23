const express = require('express');
const router = express.Router();
const UserLog = require('../models/UserLog');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

router.get('/', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const stats = await UserLog.aggregate([
            { $match: { log: 'Weather data requested' } },
            { $group: { _id: '$city', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 } // Top 10 cities
        ]);
        const labels = stats.map(s => s._id || 'Unknown');
        const dataCounts = stats.map(s => s.count);

        console.log(stats);
        res.render('admin/reports', {
            title: 'Reports',
            page: 'reports',
            stats,
            labels,
            dataCounts
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching reports.');
        return res.redirect('/admin');
    }
});

module.exports = router;