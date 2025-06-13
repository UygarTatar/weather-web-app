const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

// User Model
const User = require('../models/User');

// UserLog Model
const UserLog = require('../models/UserLog');

// Login Page
router.get('/login', (req, res) => res.render('login'));

// Register Page
router.get('/register', (req, res) => res.render('register'));

// Register Handle
router.post('/register', (req,res) =>{
    const { name, username, email, password, password2 } = req.body;
    let errors = [];

    // Check required fields
    if(!name || !username || !email || !password || !password2) {
        errors.push({ msg: 'Please fill in all fields'});
    }
    
    // Check passwords match
    if(password !== password2) {
        errors.push({ msg: 'Passwords do not match'});
    }

    // Check
    if(password.length <6) {
        errors.push({ msg: 'Password should be at least 6 characters'});
    }

    if(errors.length > 0){
        res.render('register', {
            errors,
            name,
            username,
            email,
            password,
            password2
        });
    } else {
        // Validation passed
        User.findOne({email: email})
        .then(user =>{
            if(user) {
                // User exists
                errors.push({msg: 'Email is already registered'})
                res.render('register', {
                    errors,
                    name,
                    username,
                    password,
                    password2
                });
            } else {
                const newUser = new User({
                    name,
                    username,
                    email,
                    password
                });

                // Hash Password
                bcrypt.genSalt(10, (err,salt) =>
                     bcrypt.hash(newUser.password, salt, (err,hash) => {
                        if(err) throw err;
                        // Set password to hashed
                        newUser.password = hash;
                        // Save user
                        newUser.save()
                        .then(user => {
                            req.flash('success_msg', 'You are now registered and can log in');
                            res.redirect('/users/login');
                        })
                        .catch(err => console.log(err));
                }))
            }
        });
    }

});

// Login Handle
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      const failedLog = new UserLog({
        email: req.body.email,
        ipAddress: req.ip,
        log: `Login failed: ${info.message}`
      });
      failedLog.save().catch(console.error);

      req.flash('error_msg', info.message);
      return res.redirect('/users/login');
    }

    req.logIn(user, (err) => {
      if (err) return next(err);

      const successLog = new UserLog({
        username: user.username,
        email: user.email,
        ipAddress: req.ip,
        log: 'Login successful'
      });
      successLog.save().catch(console.error);

      return res.redirect('/dashboard');
    });
  })(req, res, next);
});

// Logout Handle
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash('success_msg', 'You are logged out');
        res.redirect('/users/login');
    });
});

module.exports = router;