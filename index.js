/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const http = require('http'),
  SocketServer = require('./services/SocketServer'),
  AmqpServer = require('./services/AmqpServer'),
  AuthService = require('./services/AuthService'),
  BindStore = require('./services/BindStore'),
  Promise = require('bluebird'),
  config = require('./config'),
  bunyan = require('bunyan'),
  models = require('./models'),
  mongoose = require('mongoose'),
  log = bunyan.createLogger({name: 'socketService.index'});

mongoose.Promise = Promise;
mongoose.connect(config.mongo.url, {useNewUrlParser: true});


const init = async () => {
  mongoose.connection.on('disconnected', () => {
    throw new Error('mongo disconnected!');
  });
  models.init();


  const httpServer = http.createServer(function (request, response) {
    log.info(' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
  });
  httpServer.listen(config.ws.port, function () {
    log.info(' Server is listening on port ' + config.ws.port);
  });


  const amqpServer = new AmqpServer(config.rabbit);
  const server = new SocketServer(httpServer);
  const store = new BindStore(config.db);
  const auth = new AuthService(config.laborx);


  /**
   * subscribe to amqp
   */
  store.on(store.ADD_BIND, async (routing) => {
    await amqpServer.addBind(routing);
  });

  store.on(store.DEL_BIND, async (routing) => {
    await amqpServer.delBind(routing);
  });


  /**
   * save subscribs
   */
  server.on(server.SUBSCRIBE_TYPE, async (data) => {
    await store.addBind(data.connectionId, data.routing);
  });

  server.on(server.UNSUBSCRIBE_TYPE, async (data) => {
    await store.delBind(data.connectionId, data.routing);
  });

  server.on(server.CLOSE_TYPE, async (data) => {
    await store.delBindAll(data.connectionId);
  });

  /**
   * auth messages
   */
  server.on(server.OPEN_TYPE,  (data) => {
    auth.initAuth(data.connectionId);
  });

  server.on(server.AUTH_TYPE, async (data) => {
    await auth.finishAuth(data.connectionId, data);
  });

  auth.on(auth.UNAUTH, async (data) => {
    await server.closeConnection(data.connectionId);
  });

  auth.on(auth.AUTH_OK, async (data) => {
    await server.sendOk(data.connectionId);
  });

  /**
   * send messages
   */

  amqpServer.on(amqpServer.MESSAGE, async (data) => {
    await Promise.map(store.getConnections(data.routing), async (connectionId) => {
      await server.send(connectionId, data.routing, data.data);
    });
  });

  await store.start();
  await amqpServer.start();
  await server.start();



};

module.exports = init();
