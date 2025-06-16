const mongoose = require('mongoose');

const WeatherInfoSchema = new mongoose.Schema( {
    WeatherDate: {
        type: Date,
        required: true
    },
    CityName: {
        type: String,
        required: true,
        trim: true
    },
    Temperature: {
        type: Number,  // Celcius
        required: true
    },
    MainStatus: {
        type: String,
        enum: ["Clear","Clouds","Rain","Drizzle","Thunderstorm","Snow","Mist","Smoke","Haze","Dust","Fog","Sand","Ash","Squall","Tornado"],
        trim: true
    },
    Icon: {
        type: String,
        trim:true
    }
});

module.exports = mongoose.model('WeatherInfo', WeatherInfoSchema);