const request = require('supertest');
const app = require('../app');
const weatherService = require('../services/weatherService');
const mongoose = require('mongoose');

jest.mock('../services/weatherService');

describe('Weather API tests', () => {
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

  describe('GET /api/weather (single day weather)', () => {
    it('should return weather data for valid city and date', async () => {
      const mockData = {
        cityName: "Ankara",
        temperature: 32.36,
        mainStatus: "Rain",
        icon: "10d",
        humidity: 53,
        windSpeed: 5.8,
        id: 501,
        uvIndex: 9.29,
        sunrise: 1752806083,
        sunset: 1752858870,
        precipitation: 1,
      };
      weatherService.getWeatherData.mockResolvedValue(mockData);

      const res = await request(app).get('/api/weather?city=Ankara&date=2025-07-18');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockData);
    });

    it('should return 400 if city or date is missing', async () => {
      let res = await request(app).get('/api/weather?city=Ankara');
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');

      res = await request(app).get('/api/weather?date=2025-07-18');
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 500 if service returns null', async () => {
      weatherService.getWeatherData.mockResolvedValue(null);

      const res = await request(app).get('/api/weather?city=Ankara&date=2025-07-18');
      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/forecast (weekly weather)', () => {
    it('should return weekly forecast data for valid city', async () => {
      const mockList = [
    {
      "date": "2025-07-18",
      "temperature": 34,
      "weatherMain": "Rain",
      "weatherId": 501
    },
    {
      "date": "2025-07-19",
      "temperature": 30,
      "weatherMain": "Rain",
      "weatherId": 500
    },
    {
      "date": "2025-07-20",
      "temperature": 29,
      "weatherMain": "Clear",
      "weatherId": 800
    },
    {
      "date": "2025-07-21",
      "temperature": 30,
      "weatherMain": "Clear",
      "weatherId": 800
    },
    {
      "date": "2025-07-22",
      "temperature": 32,
      "weatherMain": "Clear",
      "weatherId": 800
    },
    {
      "date": "2025-07-23",
      "temperature": 33,
      "weatherMain": "Clear",
      "weatherId": 800
    },
    {
      "date": "2025-07-24",
      "temperature": 32,
      "weatherMain": "Clear",
      "weatherId": 800
    },
    {
      "date": "2025-07-25",
      "temperature": 32,
      "weatherMain": "Clear",
      "weatherId": 800
    }
      ];
      weatherService.getWeeklyWeather.mockResolvedValue(mockList);

      const res = await request(app).get('/api/forecast?city=Ankara');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(res.body.list).toEqual(mockList);
    });

    it('should return 400 if city is missing', async () => {
      const res = await request(app).get('/api/forecast');
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 500 if service returns null', async () => {
      weatherService.getWeeklyWeather.mockResolvedValue(null);

      const res = await request(app).get('/api/forecast?city=Ankara');
      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });
});
