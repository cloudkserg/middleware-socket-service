const config = {
	ws: {
		port: process.env.WS_PORT || 8080 
	},
	rabbit: {
		exchange: process.env.RABBIT_EXCHANGE || 'events',
		uri: process.env.RABBIT_URI || 'amqp://localhost:5672',
		serviceName: process.env.RABBIT_SERVICE_NAME || 'socket'
	},
	laborx: {
    uri: process.env.LABORX_URI || 'http://localhost:3001/api/v1/security',
    
  },
  mongo: {
    collectionPrefix: process.env.PROFILE_PREFIX || 'laborx',
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/data'

  }
};


module.exports = config;