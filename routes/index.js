const express = require('express');
const router = express.Router();
const axios = require('axios');
const { ensureAuthenticated } = require('../middleware/auth');

// Welcome page
router.get('/', (req, res) => res.render('welcome', { page: 'welcome', title: 'Welcome' }));

// About page
router.get('/about', (req, res) => res.render('about', { page: 'about', title: 'About' }));

// Contact page
router.get('/contact', (req, res) => res.render('contact', { page: 'contact', title: 'Contact' }));

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