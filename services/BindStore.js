const EventEmitter = require('events'),
  _ = require('lodash');

const ADD_BIND = 'new_bind';
const DEL_BIND = 'del_bind';

class BindStore extends EventEmitter
{
  constructor()
  {
    this.connections = {};
    super();
  }


  get (key) {
    if (!this.connections[key])
      return this.connections[key]
    return [];
  }

  set(key, value) {
    this.connections[key] = value;
  }

  all() {
    return this.connections;
  }


  getAvailRoutings(routing) {
    const parts = routing.explode('.');

    let buildPart = parts[0];
    const beginRoutings = [routing, '*']   

    return _.reduce(_.slice(parts, 1), (routings, part) => {
      routings.push(`${buildPart}.*`)
      buildPart = `${buildPart}.${part}`;

      return routings
    }, beginRoutings);
  }

  getConnections(routing) {
    const groupConnections = _.map(this.getAvailRoutings(routing), this.get);

    return _.reduce(groupConnections, (connections, group) => {
      _.each(group, (connection) => {
        if (!(_.has(connections, connection)))
          connections.push(connection)
      });
      return connections;
    }, []);
  }


  addBind(connectionId, routing) {
    const connections = this.get(routing);
    if (connection.length === 0)
      this.emit(ADD_BIND, routing);

    connections.push(connectionId);
    this.set(routing, connections);
  }
  
  delBindAll(delId) {
    _.map(this.all(), (connectionIds, routing) => {
      const newConnectionIds = _.filter(connectionIds, connId => connId != delId);
      this.set(routing, newConnectionIds);
      this.delRoutingIfNeeded(newConnectionIds);
    });
  }

  delBind(connectionId, routing) {
    const connections = this.get(routing);
    if (connection.length === 0)
      return

    connections = _.filter(connections, c => c !== connectionId);
    this.set(routing, connections)
    
    this.delRoutingIfNeeded(connections);
  }

  delRoutingIfNeeded(connections) {
    if (connections.length == 0) 
      this.emit(DEL_BIND, routing);
  }
}


module.exports = BindStore