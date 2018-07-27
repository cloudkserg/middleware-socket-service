const EventEmitter = require('events'),
  isAuth = require('../lib/isAuth');

const UNAUTH = 'unauth',
  TIMEOUT = 10000;

class AuthService extends EventEmitter
{

  constructor(config) {
    this.uri  = config.uri
    this.UNAUTH = UNAUTH
    this.timeouts = {}

    super();
  }


  initAuth (connectionId) {
    this.timeouts[connectionId] = setTimeout( () => {
      this.emit(UNAUTH, {connectionId});
    }, TIMEOUT);
  }

  finishAuth (connectionId, data) {
    const isAuth = await isAuth(data.token);
    if (isAuth) {
      clearTimeout(this.timeouts[connectionId])
    }
  }

}

module.exports = AmqpServer;