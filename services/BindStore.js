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


  addRevertBind(connectionId, routing) {
    const routings = this.get(connectionId)
    routings.push(routing)
    this.set(connectionId, routings)      
  }


  addBind(connectionId, routing) {
    const connections = this.get(routing);
    if (connections.length === 0)
      this.emit(ADD_BIND, routing);

    connections.push(connectionId);
    this.set(routing, connections);

    this.addRevertBind(conectionId, routing)
  }
  
  delBindAll(delId) {
    const routings = this.get(delId)
    _.map(routings, (routing) => {
      const connectionIds  = this.get(routing);
      const newConnectionIds = _.filter(connectionIds, connId => connId != delId);
      this.set(routing, newConnectionIds);
      this.delRoutingIfNeeded(newConnectionIds, routing);
    });

    this.del(delId);
  }

  delRevertBind(connectionId, routing) {
    const routings = this.get(connectionId);
    if (routings.length === 0)
      return

    routings = _.filter(routings, r => r !== routing);
    if (routings.length == 0)
      this.del(connectionId);
    else
      this.set(connectionId, routings)
  }

  delBind(connectionId, routing) {
    const connections = this.get(routing);
    if (connection.length === 0)
      return

    connections = _.filter(connections, c => c !== connectionId);
    this.set(routing, connections)
    
    this.delRevertBind(connectionId, routing);
    this.delRoutingIfNeeded(connections, routing);
  }

  delRoutingIfNeeded(connections, routing) {
    if (connections.length == 0) 
      this.del(routing);
      this.emit(DEL_BIND, routing);
  }
}


module.exports = BindStore