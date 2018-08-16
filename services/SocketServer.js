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
  log = bunyan.createLogger({name: 'socketService.socketServer'});


const SUBSCRIBE_TYPE = 'SUBSCRIBE';
const UNSUBSCRIBE_TYPE = 'UNSUBSCRIBE';
const CLOSE_TYPE = 'CLOSE';
const OPEN_TYPE = 'OPEN';
const AUTH_TYPE = 'AUTH';

/**
 * Class for listen websocket connection
 * and generate events on websocket events
 * 
 * @class SocketServer
 * @extends {EventEmitter}
 */
class SocketServer extends EventEmitter {
  /**
   * Creates an instance of SocketServer.
   * @param {HttpServer} httpServer as in Expressjs
   * 
   * @memberOf SocketServer
   */
  constructor (httpServer) {
    super();
    this.httpServer = httpServer;

    this.SUBSCRIBE_TYPE = SUBSCRIBE_TYPE;
    this.UNSUBSCRIBE_TYPE = UNSUBSCRIBE_TYPE;
    this.CLOSE_TYPE = CLOSE_TYPE;
    this.OPEN_TYPE = OPEN_TYPE;
    this.AUTH_TYPE = AUTH_TYPE;
  }

  /**
   * function for up websocket server
   * 
   * @memberOf SocketServer
   */
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
  
  /**
   * send message with data to connectionId about this routing
   * 
   * connectionId - id of socket connection
   * routing - key for subscibe from sockets
   * 
   * @param {String} connectionId 
   * @param {String} routing 
   * @param {Object} data 
   * 
   * @memberOf SocketServer
   */
  send (connectionId, routing, data) {
    setImmediate(() => {
      if (this._connections[connectionId])
        this._connections[connectionId].sendUTF(JSON.stringify({
          routing: routing,
          data: data
        }));
    });
  }

  /**
   * send ok message to connecitonId
   * 
   * @param {String} connectionId 
   * 
   * @memberOf SocketServer
   */
  sendOk (connectionId) {
    setImmediate(() => {
      if (this._connections[connectionId])
        this._connections[connectionId].sendUTF(JSON.stringify({ok: true}));
    });
  }
  
  /**
   * get types of avail messages for this class
   * 
   * @returns []
   * 
   * @memberOf SocketServer
   */
  getTypes () {
    return [
      SUBSCRIBE_TYPE,
      UNSUBSCRIBE_TYPE,
      AUTH_TYPE
    ];
  }

  /**
   * function for handle message from webscoket
   * 
   * @param {Object} connection 
   * @param {mixed} message 
   * 
   * @memberOf SocketServer
   */
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

  /**
   * close selected websocket connection
   * 
   * @param {String} connectionId 
   * 
   * @memberOf SocketServer
   */
  closeConnection (connectionId) {
    if (this._connections[connectionId]) 
      this._connections[connectionId].close();
    
  }


  /**
   * handle open connection
   * 
   * @param {Object} connection 
   * 
   * @memberOf SocketServer
   */
  handleOpen (connection) {
    this._connections[connection.id] = connection;
    this.emit(OPEN_TYPE, {
      connectionId: connection.id
    });
  }

  /**
   * Handle error on connection
   * 
   * @param {Object} connection 
   * 
   * @memberOf SocketServer
   */
  handleError (connection) {
    this.handleClose(connection);
  }

  /**
   * Handle close on connection
   * 
   * @param {Object} connection 
   * 
   * @memberOf SocketServer
   */
  handleClose (connection) {
    // eslint-disable-next-line
    this.emit(CLOSE_TYPE, {connectionId: connection.id})

    delete this._connections[connection.id];
  }

  /**
   * Shutdown websocket server
   * 
   * 
   * @memberOf SocketServer
   */
  shutdown () {
    this.wsServer.shutDown();
  }
}

module.exports = SocketServer;

