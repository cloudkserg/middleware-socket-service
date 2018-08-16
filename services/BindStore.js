/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const EventEmitter = require('events'),
  level = require('level'),
  fs = require('fs'),
  Promise = require('bluebird'),
  getAvailRoutings = require('../lib/getAvailRoutings'),
  _ = require('lodash'),
  rimraf = require('rimraf');

const ADD_BIND = 'new_bind';
const DEL_BIND = 'del_bind';


const connKey = (connId) => `connection.${connId}`;
const routingKey = (route) => `routing.${route}`;
const routingFromKey = (key) => key.split('.').slice(1).join('.');

const bindFromRouting = (routing) => {
  let bindRouting = routing;
  const parts = routing.split('.');
  if (parts.length > 2)
    bindRouting = `${parts[0]}.${parts[1]}.*`;
  return bindRouting;
};

/**
 * Class for save binds [routing <--> connectionId]
 * and for select routes for connection
 * and for select connections for routes
 * 
 * @class BindStore
 * @extends {EventEmitter}
 */
class BindStore extends EventEmitter
{
  /**
   * Creates an instance of BindStore.
   * @param {Object} config
   * Options are:
   * file - file(folder) for save db 
   * 
   * @memberOf BindStore
   */
  constructor (config) {
    super();
    this._file = config.file;
    this.ADD_BIND = ADD_BIND;
    this.DEL_BIND = DEL_BIND;
    this._binds = [];
  }

  /**
   * start - init database and clear old info
   * 
   * @memberOf BindStore
   */
  async start () {
    if (fs.existsSync(this._file)) 
      await new Promise(res => {
        rimraf(this._file, res);
      });
    this.db = level(this._file);
  }

  /**
   * close database
   * 
   * 
   * @memberOf BindStore
   */
  async close () {
    await this.db.close();
  }


  /**
   * get value by key
   * 
   * @param {any} key 
   * @returns 
   * 
   * @memberOf BindStore
   */
  async get (key) {
    return await new Promise((res, rej) => {
      this.db.get(key, function (err, value) {
        if (err || value === undefined)
          return err.notFound ? res([]) : rej(err);
        res(JSON.parse(value));
      });
    });
  }

  /**
   * set in db key:value
   * 
   * @param {any} key 
   * @param {any} value 
   * 
   * @memberOf BindStore
   */
  async set (key, value) {
    await this.db.put(key, JSON.stringify(value));
  }

  /**
   * del key in db
   * 
   * @param {any} key 
   * 
   * @memberOf BindStore
   */
  async del (key) {
    await this.db.del(key);
  }

  /**
   * add in db value to key, and call beforeCreate before save
   * 
   * @param {any} key 
   * @param {any} value 
   * @param {any} [beforeCreate=() => {}] 
   * 
   * @memberOf BindStore
   */
  async add (key, value, beforeCreate = () => {}) {
    const values = await this.get(key);
    if (values.length === 0)
      beforeCreate(key, values);
    
    if (!values.push) 
      throw new Error('not array in level by key ' + key + ' typeof = ' + typeof values);

    values.push(value);
    await this.set(key, _.uniq(values));
  }

  /**
   * Cut value from key, and call afterDel after cut
   * 
   * @param {any} key 
   * @param {any} value 
   * @param {any} [afterDel=() => {}] 
   * @returns 
   * 
   * @memberOf BindStore
   */
  async cut (key, value, afterDel = () => {}) {
    const values = await this.get(key);
    if (values.length === 0)
      return;

    const filterValues = _.filter(values, v => v !== value);
    if (filterValues.length === 0) {
      await this.del(key);
      afterDel(key, filterValues);
    } else 
      await this.set(key, filterValues);
  }

  /**
   * get connections for this routing
   * connections that subscribe to this route
   * 
   * @param {String} routing 
   * @returns []
   * 
   * @memberOf BindStore
   */
  async getConnections (routing) {
    const connectionIds = await Promise.mapSeries(
      getAvailRoutings(routing), 
      async (routing) => {
        return await this.get(routingKey(routing));
      }
    );
    return _.chain(connectionIds)
      .filter(m => m.length !== 0)
      .flatten()
      .uniq()
      .value();
  }

  /**
   * Add bind between connectionId and routing
   * 
   * @param {String} connectionId 
   * @param {String} routing 
   * 
   * @memberOf BindStore
   */
  async addBind (connectionId, routing) {
    await this.add(routingKey(routing), connectionId, this._emitBindIfNeed.bind(this));
    await this.add(connKey(connectionId), routing);
  }

  /**
   * Del all routings for this connectionId
   * 
   * @param {String} delId 
   * 
   * @memberOf BindStore
   */
  async delBindAll (delId) {
    _.each(
      await this.get(delId), 
      async (routing) => await this.delBind(delId, routing).bind(this)
    );
  }

  /**
   * 
   * Del only this pair connectionId <--> routing
   * 
   * @param {String} connectionId 
   * @param {String} routing 
   * 
   * @memberOf BindStore
   */
  async delBind (connectionId, routing) {
    await this.cut(routingKey(routing), connectionId);
    await this.cut(connKey(connectionId), routing);
  }


  _emitBindIfNeed (key, connections) {
    if (connections.length === 0) {
      const routing = routingFromKey(key);

      const bind = bindFromRouting(routing);
    
      if (!this._binds.includes(bind)) {
        this._binds.push(bind);
        this.emit(ADD_BIND, bind);
      }
    }
  }

}


module.exports = BindStore;
