const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

const { ensureAuthenticated } = require('../middleware/auth');
const emailVerificationService = require('../services/emailVerificationService');
const tokenService = require('../services/tokenService');

// User Model
const User = require('../models/User');

// UserLog Model
const UserLog = require('../models/UserLog');

// Login Page
router.get('/login', (req, res) => res.render('login', { page: 'login', title: 'Login' }));

// Register Page
router.get('/register', (req, res) => res.render('register', { page: 'register', title: 'Register' }));

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
            title: 'Register',
            page: 'register',
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
                    title: 'Register',
                    page: 'register',
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
                bcrypt.genSalt(10, (err, salt) =>
                  bcrypt.hash(newUser.password, salt, async (err, hash) => {
                    if (err) throw err;
                    // Set password to hashed
                    newUser.password = hash;
                    // Save user
                    try {
                      const user = await newUser.save();
                      await emailVerificationService.generateAndSendVerification(user, req);
                      req.flash('success_msg', 'Registration successful! Please check your email to verify your account.');
                      res.redirect('/users/login');
                    } catch (err) {
                      console.log(err);
                      req.flash('error_msg', 'Registration failed. Please try again.');
                      res.redirect('/users/register');
                    }
                  })
                )
            }
        });
    }

});

// Verify Email
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        req.flash('error_msg', 'Invalid or missing token.');
        return res.redirect('/users/login');
    }
    const user = await emailVerificationService.verifyUserByToken(token);
    if (!user) {
        req.flash('error_msg', 'Verification link is invalid or has expired.');
        return res.redirect('/users/login');
    }
    req.flash('success_msg', 'Your email has been verified. You can now log in.');
    res.redirect('/users/login');
});

// Login Handle
router.post('/login', (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      const failedLog = new UserLog({
        email: req.body.email,
        ipAddress: req.ip,
        log: `Login failed: ${info.message}`
      });
      await failedLog.save().catch(console.error);

      req.flash('error_msg', info.message);
      return res.redirect('/users/login');
    }

    req.logIn(user, async (err) => {
      if (err) return next(err);

      const accessToken = tokenService.generateAccessToken(user);
      const refreshToken = tokenService.generateRefreshToken(user);

      // Save Refresh Token to DB
      await tokenService.saveRefreshToken(user._id, refreshToken);

      console.log('Logged in user:', user);

      const successLog = new UserLog({
        username: user.username,
        email: user.email,
        ipAddress: req.ip,
        log: 'Login successful'
      });
      await successLog.save().catch(console.error);

      // Send access token as a HTTPOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'Strict', // Adjust as needed
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Optionally, you can send the access token in the response body if needed
      // return res.json({ accessToken });

      // Admin 
      if (user.userType === 'Admin') {
        return res.redirect('/admin/dashboard');
      }

      return res.redirect('/dashboard');
    });
  })(req, res, next);
});

// Show Profile 
router.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('profile', {
    title: 'Profile',
    page: 'profile',
    user: req.user
  });
});

// Update Profile
router.post('/profile', ensureAuthenticated, async (req, res) => {
  const { name, password, password2, defaultCityName } = req.body;
  let errors = [];

  if (!name || !defaultCityName) {
    errors.push({ msg: 'Name and Default City Name cannot be empty' });
  }
  
  // Check password change
  if (password || password2) {
    if (password !== password2) {
      errors.push({ msg: 'Passwords do not match' });
    }
    if (password.length < 6) {
      errors.push({ msg: 'Password should be at least 6 characters' });
    }
  }

  if (errors.length > 0) {
    return res.render('profile', { page: 'profile', title: 'Profile', errors, user: req.user });
  }

  try {
    const user = await User.findById(req.user.id);
    user.name = name;
    user.defaultCityName = defaultCityName;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    req.flash('success_msg', 'Your profile has been successfully updated');
    res.redirect('/users/profile');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'An error occurred');
    res.redirect('/users/profile');
  }
});

// Profile to Dashboard
router.get('/profile-redirect', ensureAuthenticated, (req, res) => {
  if (req.user.userType === 'Admin') {
    return res.redirect('/admin/dashboard');
  }
  return res.redirect('/dashboard');
});

// Weather to Dashboard
router.get('/weather-redirect', ensureAuthenticated, (req, res) => {
  if (req.user.userType === 'Admin') {
    return res.redirect('/admin/dashboard');
  }
  return res.redirect('/dashboard');
});

// Refresh Token Handle
router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token missing' });
  }

  try {
    const payload = tokenService.verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.id);

    if (!user || !user.refreshTokens.includes(refreshToken)){
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Generate new access token
    const newAccessToken = tokenService.generateAccessToken(user);

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('Refresh token error:', err.message);
    return res.status(403).json({ message: 'Invalid or expired refresh token' });
}});

// Logout Handle
router.get('/logout', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if(refreshToken) {
      // Clear cookie
      res.clearCookie('refreshToken');

      // If the user is logged in, remove the refresh token from the database
      if(req.user) {
        await User.findByIdAndUpdate(req.user._id, {
          $pull: { refreshTokens: refreshToken }
      });
    }
  }

  req.logout((err) => {
      if (err) return next(err);
      req.flash('success_msg', 'You are logged out');
      res.redirect('/users/login');
    });
  } catch (err) {
    console.error('Logout error:', err);
    req.flash('error_msg', 'An error occurred while logging out');
    res.redirect('/users/login');
  }
});

module.exports = router;