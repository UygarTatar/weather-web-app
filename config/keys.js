require('dotenv-flow').config();

const MongoURI = process.env.NODE_ENV === 'test'
  ? process.env.TEST_MONGO_URI
  : process.env.MONGO_URI;

module.exports = {
    MongoURI,
    API_KEY: process.env.API_KEY
};