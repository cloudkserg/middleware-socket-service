const EventEmitter = require('events'),
  isAuth = require('../lib/isAuth');

const UNAUTH = 'unauth',
  AUTH = 'auth',
  AUTH_OK = 'authOk',
  TIMEOUT = 5000;
/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
class AuthService extends EventEmitter
{

  constructor (config) {
    super();
    this.url  = config.url;
    this.UNAUTH = UNAUTH;
    this.AUTH = AUTH;
    this.AUTH_OK = AUTH_OK;
    this.timeouts = {};

  }


  initAuth (connectionId) {
    this.timeouts[connectionId] = setTimeout( () => {
      this.emit(UNAUTH, {connectionId});
    }, TIMEOUT);
  }

  async finishAuth (connectionId, data) {
    const isAuthFlag = await isAuth(this.url, data.token);
    if (isAuthFlag) {
      clearTimeout(this.timeouts[connectionId]);
      this.emit(AUTH_OK, {connectionId});
    }
  }

}

module.exports = AuthService;
