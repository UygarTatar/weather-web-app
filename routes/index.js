const express = require('express');
const router = express.Router();
const axios = require('axios');
const { ensureAuthenticated } = require('../config/auth');

// Welcome page
router.get('/', (req, res) => res.render('welcome', { page: 'welcome'}));

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {
   res.render('dashboard', {
      user: req.user,
      weather: null,
      page: 'dashboard',
      title: "Dashboard"
   });
});

module.exports = router;