/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const EventEmitter = require('events'),
  isAuth = require('../lib/isAuth');

const UNAUTH = 'unauth',
  AUTH = 'auth',
  AUTH_OK = 'authOk',
  TIMEOUT = 5000;

/**
 * Class for Authentication process
 * 
 * start auth, wait message about auth and check it
 * if not get message or wrong auth message, generate fail message
 * 
 * @class AuthService
 * @extends {EventEmitter}
 */
class AuthService extends EventEmitter
{

  /**
   * Creates an instance of AuthService.
   * @param {Object} config 
   * Options are:
   * url - url for laborx authentication service
   * 
   * @memberOf AuthService
   */
  constructor (config) {
    super();
    this.url  = config.url;
    this.UNAUTH = UNAUTH;
    this.AUTH = AUTH;
    this.AUTH_OK = AUTH_OK;
    this.TIMEOUT = TIMEOUT;
    this.timeouts = {};

  }


  /**
   * Start auth process for selected connectionId
   * if not get auth message after timeout
   * generate UNAUTH message
   * 
   * @param {String} connectionId 
   * 
   * @memberOf AuthService
   */
  initAuth (connectionId) {
    this.timeouts[connectionId] = setTimeout( () => {
      this.emit(UNAUTH, {connectionId});
    }, TIMEOUT);
  }

  /**
   * Finish auth process
   * Check if data right for authentication
   * if right, reset timeout and generate AUTH_OK message
   * 
   * @param {String} connectionId 
   * @param {mixed} data 
   * 
   * @memberOf AuthService
   */
  async finishAuth (connectionId, data) {
    const isAuthFlag = await isAuth(this.url, data.token);
    if (isAuthFlag) {
      clearTimeout(this.timeouts[connectionId]);
      this.emit(AUTH_OK, {connectionId});
    }
  }

}

module.exports = AuthService;
