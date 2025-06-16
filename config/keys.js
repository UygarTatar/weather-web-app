require('dotenv').config();

module.exports = {
    MongoURI: process.env.MONGO_URI,
    API_KEY: process.env.API_KEY
};