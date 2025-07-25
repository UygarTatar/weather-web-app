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
        const { lat, lon , name } = await getCityCoordinates(cityName);

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

        const current = weatherRes.data.current;

        const temperature = current.temp;
        const mainStatus = current.weather[0].main;
        const icon = current.weather[0].icon;
        const humidity = current.humidity;
        const windSpeed = current.wind_speed;
        const uvIndex = current.uvi;
        const precipitation = matchedDay.pop;
        const sunrise = matchedDay.sunrise;
        const sunset = matchedDay.sunset;
        const weatherId = current.weather[0].id;

        return { cityName: name, temperature, mainStatus, icon, humidity, windSpeed, id: weatherId, uvIndex, sunrise, sunset, precipitation };

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
};

const getCitySuggestions = async (cityQuery) => {
    const geoRes = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
        params: { q: cityQuery, limit: 3, appid: API_KEY }
    });
    return geoRes.data.map(entry => ({
        name: entry.name,
        country: entry.country,
        lat: entry.lat,
        lon: entry.lon
    }));
};

module.exports = { getWeatherData, getWeeklyWeather, getCitySuggestions };