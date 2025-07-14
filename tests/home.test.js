const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');

describe('Homepage', () => {
  it('should return 200 OK and contain the word "Weather"', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('weather');
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});