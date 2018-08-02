/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const EventEmitter = require('events'),
  getAvailRoutings = require('../util/getAvailRoutings'),
  _ = require('lodash');

const ADD_BIND = 'new_bind';
const DEL_BIND = 'del_bind';


const connKey = (connId) => `connection.${connId}`;
const routingKey = (route) => `routing.${route}`;
const routingFromKey = (key) => key.split('.')[1];

const bindFromRouting = (routing) => {
  let bindRouting = routing;
  const parts = routing.split('.');
  if (parts.length > 2)
    bindRouting = `${parts[0]}.${parts[1]}.*`;
  return bindRouting;
};

class BindStore extends EventEmitter
{
  constructor () {
    super();
    this.ADD_BIND = ADD_BIND;
    this.DEL_BIND = DEL_BIND;
    this.db = {};
    this._binds = [];
  }


  async get (key) {
    if (this.db[key])
      return this.db[key];
    return [];
  }

  async set (key, value) {
    this.db[key] = value;
  }

  async del (key) {
    if (this.db[key])
      delete this.db[key];
  }

  async add (key, value, beforeCreate) {
    const values = await this.get(key);
    if (values.length === 0)
      beforeCreate(key, values);
    
    values.push(value);
    await this.set(key, _.uniq(values));
  }

  async cut (key, value, afterDel) {
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

  async addBind (connectionId, routing) {
    await this.add(routingKey(routing), connectionId, this._emitBindIfNeed.bind(this));
    await this.add(connKey(connectionId), routing);
  }

  async delBindAll (delId) {
    _.each(
      await this.get(delId), 
      async (routing) => await this.delBind(delId, routing).bind(this)
    );
  }

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
        this._emit(ADD_BIND, bind);
      }
    }
  }

}


module.exports = BindStore;
