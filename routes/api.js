const express = require('express');
const router = express.Router();
const { getWeeklyWeather, getWeatherData, getCitySuggestions } = require('../services/weatherService');
const UserLog = require('../models/UserLog');

// Single day weather
router.get('/weather', async (req, res) => {
    const { city, date } = req.query;
    if (!city || !date) return res.status(400).json({ error: 'City and date required' });

    const data = await getWeatherData(city, date);
    if (!data) return res.status(500).json({ error: 'Weather fetch failed' });

    try {
        await UserLog.create({
            username: req.user ? req.user.username : 'Anonymous',
            email: req.user ? req.user.email : 'Anonymous',
            city,
            ipAddress: req.ip,
            log: 'Weather data requested'
        });
    } catch (err) {
        console.error('User log error:', err.message);
    }

    res.json(data);
});

// Weekly weather
router.get('/forecast', async (req, res) => {
    const { city } = req.query;
    if (!city) return res.status(400).json({ error: 'City required' });

    const data = await getWeeklyWeather(city);
    if (!data) return res.status(500).json({ error: 'Forecast fetch failed' });

    res.json({ list: data });
});

// City suggestions
router.get('/city-suggestions', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Query required' });

    try {
        const suggestions = await getCitySuggestions(query);
        if (!suggestions.length) return res.status(404).json({ error: 'No suggestions found' });

        res.json(suggestions);
    } catch (err) {
        console.error('City suggestion error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;