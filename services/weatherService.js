const axios = require('axios');
const { API_KEY } = require('../config/keys');

const getCityCoordinates = async (cityName) => {
    const geoRes = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
        params: { q: cityName, limit: 1, appid: API_KEY }
    });
    if (!geoRes.data.length) throw new Error('City not found');
    return geoRes.data[0]; // { lat, lon, name, ... }
}

const getWeatherData = async (cityName, weatherDate) => {
    try {
        const { lat, lon } = await getCityCoordinates(cityName);

        const weatherRes = await axios.get('https://api.openweathermap.org/data/3.0/onecall', {
            params: {
                lat,
                lon,
                units: 'metric',
                lang: 'tr',
                appid: API_KEY
            }
        });

        console.log('Weather response:', weatherRes.data);

        if (!weatherRes.data.current) {
            throw new Error('Current weather data not found in response');
        }

        const matchedDay = weatherRes.data.daily.find(day => {
            const date = new Date(day.dt * 1000).toISOString().split('T')[0];
            return date === weatherDate;
        });

        if (!matchedDay) throw new Error('Weather data for given date not found');

        const temperature = matchedDay.temp.day;
        const mainStatus = matchedDay.weather[0].main;
        const icon = matchedDay.weather[0].icon;

        return { temperature, mainStatus, icon };

    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
        return null;;
    }
};

const getWeeklyWeather = async (cityName) => {
    try {
        const { lat, lon } = await getCityCoordinates(cityName);
        console.log('City name:', cityName);

        const weatherRes = await axios.get('https://api.openweathermap.org/data/3.0/onecall', {
            params: {
                lat,
                lon,
                exclude: 'current,minutely,hourly,alerts',
                units: 'metric',
                lang: 'tr',
                appid: API_KEY
            }
        });
        
        const dailyData = weatherRes.data.daily.map(day => ({
            date: new Date(day.dt * 1000).toISOString().split('T')[0],
            temperature: Math.round(day.temp.day),
            weatherMain: day.weather[0].main,
            weatherId: day.weather[0].id,
        }));

        return dailyData;

    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
        return null;
    }
}

module.exports = { getWeatherData, getWeeklyWeather };