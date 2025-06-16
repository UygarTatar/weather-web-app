const axios = require('axios');
const { API_KEY } = require('../config/keys');

const getWeatherData = async (cityName) => {
    try {
        const geoRes = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
            params: {
                q: cityName,
                limit: 1,
                appid: API_KEY
            }
        });
        console.log('Geo response:', geoRes.data);

        if (!geoRes.data.length) throw new Error('City not found');

        const { lat, lon } = geoRes.data[0];

        const weatherRes = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                lat: lat,
                lon: lon,
                units: 'metric',
                lang: 'tr',
                appid: API_KEY
            }
        });

        console.log('Weather response:', weatherRes.data);

        const temperature = weatherRes.data.main.temp;
        const mainStatus = weatherRes.data.weather[0].main;
        const icon = weatherRes.data.weather[0].icon;

        return { temperature, mainStatus, icon };

    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
        return null;;
    }
};

module.exports = { getWeatherData };
