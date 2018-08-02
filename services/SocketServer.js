/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const EventEmitter = require('events'),
  WebSocketServer = require('websocket').server,
  uniqid = require('uniqid'),
  Event = require('../events/Event'),
  AuthEvent = require('../events/AuthEvent'),
  bunyan = require('bunyan'),
  _ = require('lodash'),
  log = bunyan.createLogger({name: 'socketService.socketServer'});


const SUBSCRIBE_TYPE = 'SUBSCRIBE';
const UNSUBSCRIBE_TYPE = 'UNSUBSCRIBE';
const CLOSE_TYPE = 'CLOSE';
const OPEN_TYPE = 'OPEN';
const AUTH_TYPE = 'AUTH';


class SocketServer extends EventEmitter {
  constructor (httpServer) {
    super();
    this.httpServer = httpServer;

    this.SUBSCRIBE_TYPE = SUBSCRIBE_TYPE;
    this.UNSUBSCRIBE_TYPE = UNSUBSCRIBE_TYPE;
    this.CLOSE_TYPE = CLOSE_TYPE;
    this.OPEN_TYPE = OPEN_TYPE;
    this.AUTH_TYPE = AUTH_TYPE;
  }

  start () {
    this.wsServer = new WebSocketServer({
      httpServer: this.httpServer,
      fragmentOutgoingMessages: false
    });

    this._connections = {};
    this._timeouts = {};

    this.wsServer.on('request', (request) => {
      const connection = request.accept(null, request.origin);
      connection.id = uniqid();

      this.handleOpen(connection);

      connection.on('close', () => {
        this.handleClose(connection);
      });

      connection.on('error', (e) => {
        this.handleError(connection, e);
      });

      // Handle incoming messages
      connection.on('message', (message) => {
        this.handleMessage(connection, message);
      });
    });
    log.info('successfully initialized');
  }
	
  send (connectionId, routing, data) {
    setImmediate(() => {
      if (this._connections[connectionId])
        this._connections[connectionId].sendUTF(JSON.stringify({
          routing: routing,
          data: data
        }));
    });
  }

  sendOk (connectionId) {
    setImmediate(() => {
      if (this._connections[connectionId])
        this._connections[connectionId].sendUTF(JSON.stringify({ok: true}));
    });
  }
	
  getTypes () {
    return [
      SUBSCRIBE_TYPE,
      UNSUBSCRIBE_TYPE,
      AUTH_TYPE
    ];
  }

  handleMessage (connection, message) {
    if (message.type === 'utf8') 
      try {
        const data = JSON.parse(message.utf8Data);
        if (!data.type) 
          throw new Error('Doesn\'t specified channel or type ');

        if (this.getTypes().indexOf(data.type) === -1)
          throw new Error('Doesn\'t specified register/unregister type');

        const event = data.type === this.AUTH_TYPE ? AuthEvent.create(connection.id,data) : 
          Event.create(connection.id, data);
        
        this.emit(data.type, event);
      } catch (e) {
        log.error(`bad message [${message.utf8Data}]. Cause: ${e.message}`);
      }
    
  }

  closeConnection (connectionId) {
    if (this._connections[connectionId]) 
      this._connections[connectionId].close();
    
  }


  handleOpen (connection) {
    this._connections[connection.id] = connection;
    this.emit(OPEN_TYPE, {
      connectionId: connection.id
    });
  }

  handleError (connection) {
    this.handleClose(connection);
  }

  handleClose (connection) {
    // eslint-disable-next-line
    this.emit(CLOSE_TYPE, connection.id)

    delete this._connections[connection.id];
  }

  shutdown () {
    this.wsServer.shutDown();
  }
}

module.exports = SocketServer;

