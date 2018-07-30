const EventEmitter = require('events')
const WebSocketServer = require('websocket').server
const saveConnection = require('../lib/addBind'),
	getConnections = require('../lib/getConnections')

const uniqid = require('uniqid')
const bunyan = require('bunyan'),
  log = bunyan.createLogger({name: 'socketService.socketServer'});


const SUBSCIBE_TYPE = 'subscribe'
const UNSUBSCRIBE_TYPE = 'unsubscribe'
const CLOSE_TYPE = 'close'
const OPEN_TYPE = 'open'
const AUTH_TYPE = 'auth'


class SocketServer extends EventEmitter {
  constructor (httpServer) {
		this.httpServer = httpServer


		this.SUBSCIBE_TYPE = SUBSCIBE_TYPE
		this.UNSUBSCRIBE_TYPE = UNSUBSCRIBE_TYPE
		this.CLOSE_TYPE = CLOSE_TYPE
		this.OPEN_TYPE = OPEN_TYPE
		this.AUTH_TYPE = AUTH_TYPE
    super()
  }

  start () {
    this.wsServer = new WebSocketServer({
      httpServer: this.httpServer,
      fragmentOutgoingMessages: false
    })

		this._connections = {}
		this._timeouts = {}

    this.wsServer.on('request', (request) => {
      const connection = request.accept(null, request.origin)
      connection.id = uniqid()

      this.handleOpen(connection)

      connection.on('close', () => {
        this.handleClose(connection)
      })

      connection.on('error', (e) => {
        this.handleError(connection, e)
      })

      // Handle incoming messages
      connection.on('message', (message) => {
        this.handleMessage(connection, message)
      })
    })
    log.info('successfully initialized')
	}
	
  send (connectionId, data) {
    setImmediate(() => {
      this._connections[connectionId].sendUTF(JSON.stringify(data))
    })
	}
	
	getTypes() {
		return [
			SUBSCIBE_TYPE,
			UNSUBSCRIBE_TYPE,
			AUTH_TYPE
		]
	}

  handleMessage (connection, message) {
    if (message.type === 'utf8') {
      try {
        const data = JSON.parse(message.utf8Data)
        if (!data.routing || !data.type) {
          throw new Error("Doesn't specified channel or type ")
				}

				if (!_.find(this.getTypes(), data.type)) 
					throw new Error("Doesn't specified register/unregister type")
				
				this.emit(data.type, {
					connectionId: connection.id, 
					routing: data.routing,
					data: data
				})
      } catch (e) {
        log.error(`bad message [${message.utf8Data}]. Cause: ${e.message}`)
      }
    }
	}

	closeConnection (connectionId) {
		this._connections[connectionId].close();
	}


  handleOpen (connection) {
		this._connections[connection.id] = connection
		this.emit(OPEN_TYPE, {
			connectionId: connection.id
		})
  }

  handleError (connection, error) {
    this.handleClose(connection)
  }

  handleClose (connection) {
    // eslint-disable-next-line
    this.emit(CLOSE_TYPE, connection.id)

    delete this._connections[connection.id]
  }

  shutdown () {
    this.wsServer.shutDown()
  }
}

module.exports = SocketServer
