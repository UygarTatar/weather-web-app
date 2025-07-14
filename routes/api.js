const express = require('express');
const router = express.Router();
const { getWeeklyWeather, getWeatherData } = require('../services/weatherService');

// Single day weather
router.get('/weather', async (req, res) => {
    const { city, date } = req.query;
    if (!city || !date) return res.status(400).json({ error: 'City and date required' });

    const data = await getWeatherData(city, date);
    if (!data) return res.status(500).json({ error: 'Weather fetch failed' });

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

module.exports = router;