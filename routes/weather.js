const express = require('express');
const router = express.Router();
const Weather = require('../models/WeatherInfo');
const { ensureAuthenticated, ensureAdmin } = require('../config/auth');
const { getWeatherData } = require('../services/weatherService');

// Listings
router.get('/', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const { city, date } = req.query;
        const filter = {};
        if (city) {
            filter.CityName = { $regex: new RegExp(city, 'i') }; // case-insensitive
        }
        if (date) {
            const start = new Date(date);
            const end = new Date(date);
            end.setDate(end.getDate() + 1);
            filter.WeatherDate = { $gte: start, $lt: end };
        }

        const weathers = await Weather.find(filter).sort({ WeatherDate: -1, CityName: 1 });

        res.render('admin/weather', { weathers, user: req.user, page: 'weather', title: "Weather Management", query: req.query });

    } catch (err) {
        console.error(err);
        res.send("An error occured");
    }
});

// Add New Record
router.post('/add', ensureAuthenticated, ensureAdmin, async (req, res) => {
    const { WeatherDate, CityName } = req.body;

    try {
        const weatherData = await getWeatherData(CityName, WeatherDate);
        const newWeather = new Weather({
            WeatherDate,
            CityName,
            Temperature: weatherData.temperature,    
            MainStatus: weatherData.mainStatus,
            Icon: weatherData.icon
        });


        await newWeather.save();
        
        req.flash('success_msg', 'Weather data added successfully.');
        res.redirect('/admin/weather');
    } catch(err) {
        console.error(err);
        req.flash('error_msg', 'Error saving weather data.');
        res.redirect('/admin/weather');
    }
});

// Delete record
router.post('/delete/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        await Weather.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Weather data deleted.');
        res.redirect('/admin/weather');
    } catch (err) {
        console.log(err);
        req.flash('error_msg', 'Error deleting weather data.');
        res.redirect('/admin/weather');
    }

});

module.exports = router;