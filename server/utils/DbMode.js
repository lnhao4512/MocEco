const mongoose = require('mongoose');
const MyConstants = require('./MyConstants');

function isMongoReady() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

function useInMemoryFallback() {
  return Boolean(MyConstants.ENABLE_INMEMORY_FALLBACK);
}

module.exports = { isMongoReady, useInMemoryFallback };

