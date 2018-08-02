/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */

require('dotenv').config();
module.exports = {
  ws: {
    port: process.env.WS_PORT || 8080 
  },
  rabbit: {
    exchange: process.env.RABBIT_EXCHANGE || 'events',
    url: process.env.RABBIT_URI || 'amqp://localhost:5672',
    serviceName: process.env.RABBIT_SERVICE_NAME || 'socket'
  },
  laborx: {
    url: process.env.LABORX_URI || 'http://localhost:3001/api/v1/security',
    
  },
  mongo: {
    collectionPrefix: process.env.PROFILE_PREFIX || 'laborx',
    url: process.env.MONGO_URI || 'mongodb://localhost:27017/data'

  }
};
