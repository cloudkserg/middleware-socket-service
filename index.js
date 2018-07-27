
const http = require('http');
const SocketServer = require('./services/SocketServer'),
	AmqpServer = require('./services/AmqpServer'),
	AuthService = require('./services/AuthService'),
	BindStore = require('./services/BindStore'),
	Promise = require('bluebird'),
	config = require('./config'),
	bunyan = require('bunyan'),
  log = bunyan.createLogger({name: 'socketService.index'});



const init = async () => {


	const httpServer = http.createServer(function(request, response) {
			log.info(' Received request for ' + request.url);
			response.writeHead(404);
			response.end();
	});
	httpServer.listen(config.ws.port, function() {
			log.info(' Server is listening on port ' + config.ws.port);
	});


	const amqpServer = new AmqpServer(config.amqp);
	const server = new SocketServer(server);
	const store = new BindStore();
	const auth = new AuthService(config.laborx);

	store.on(store.ADD_BIND, async (routing) => {
		await amqpServer.addBind(routing);
	});

	store.on(store.DEL_BIND, async (routing) => {
		await amqpServer.delBind(routing);
	});


	server.on(server.SUBSCRIBE_TYPE, function (data) {
		await store.addBind(data.connectionId, data.routing)
	});

	server.on(server.UNSUBSCRIBE_TYPE, function (data) {
		await store.delBind(data.connectionId, data.routing)
	});

	server.on(server.CLOSE_TYPE, function (data) {
		await store.delBindAlls(data.connectionId)
	});

	server.on(server.OPEN_TYPE, function (data) {
		await auth.initAuth(data.connectionId)
	})

	server.on(server.AUTH_TYPE, function (data) {
		await auth.finishAuth(data.connectionId, data)
	})

	auth.on(auth.UNAUTH, function (data) {
		await server.closeConnection(data.connectionId);
	});


	amqpServer.on(amqpServer.MESSAGE, async (data) => {
		await Promise.map(store.getConnections(data.routing), async (connectonId) => {
			await server.send(connectionId, data);
		});
	});

	await amqpServer.start();
	await server.start();



};

module.exports = init();
