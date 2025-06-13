const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load User Model
const User = require('../models/User');

module.exports = function(passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email'}, (email,password,done) => {
            // Match User
            User.findOne({ email: email})
            .then(user => {
                if(!user) {
                    return done(null, false, { message: 'That email is not registered'});
                }

                // Lock control
                if (user.lockUntil && user.lockUntil > Date.now()) {
                    const remaining = Math.ceil((user.lockUntil - Date.now()) / 1000);
                    return done(null, false, { message: `Account locked. Please try again after ${remaining} seconds.`  });
                }

                // Match password
                bcrypt.compare(password, user.password, (err,isMatch) => {
                    if(err) throw err;

                    if(isMatch) {
                        user.loginAttempts = 0;
                        user.lockUntil = undefined;
                        user.save()
                        .then(() => done(null, user))
                        .catch(err => done(err));   
                    } else {
                        user.loginAttempts += 1;

                        if (user.loginAttempts >= 2) {
                            user.lockUntil = Date.now() + 60 * 1000;
                            user.loginAttempts = 0;
                        }
                        user.save()
                        .then(() => done(null, false, { message: 'Password incorrect' }))
                        .catch(err => done(err));
                    }
                });
            })
            .catch(err => console.log(err));
        })
    );

    passport.serializeUser((user,done) => {
        done(null,user.id);
    });

    passport.deserializeUser(async (id,done) => {
        try {
            const user = await User.findById(id);
            done(null,user);
        } catch (err) {
            done(err,null);
        }
    });
}