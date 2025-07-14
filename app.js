const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');

const app = express();

// .env Config
require('dotenv-flow').config();

// Passport Config
require('./config/passport')(passport);

// DB Config
const db = require('./config/keys').MongoURI

// Connect to Mongo
mongoose.connect(db)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

// EJS
app.use(expressLayouts);
app.set('view engine','ejs')

// Bodyparser
app.use(express.urlencoded({extended: false}));
app.use(express.json()); 

// Static files (CSS, JS, Images)
app.use(express.static('public'));

// Cookie Parser
app.use(cookieParser());

// Express session 
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        secure: false, // For testing, set to true in production
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global Vars
app.use((req,res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
})

// Routes
const { usersLimiter, apiLimiter, loginLimiter } = require('./middleware/rateLimiters');
app.use('/users/login', loginLimiter); 
app.use('/users', usersLimiter, require('./routes/users'));
app.use('/api', apiLimiter, require('./routes/api'));  

app.use('/', require('./routes/index'));
app.use('/admin', require('./routes/admin'));
app.use('/admin/weather', require('./routes/weather'));
app.use('/admin/users', require('./routes/adminUsers'));

// Test JWT route
app.use('/test', require('./routes/testJwt'));

// 404 middleware
app.use((req, res, next) => {
  res.status(404).render('404', { title: '404 Not Found', page: 404 });
});

module.exports = app;