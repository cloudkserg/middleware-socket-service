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

  getConnections(routing) {
    return _.chain(connections).filter((c, r) => {
      return (r === routing) || routing.match('/' + r + '/');
    }).map((c, r) => { return c; }).value();
  }


  addBind(connectionId, routing) {
    if (!this.connections[routing]) {
      this.connections[routing] = []
      this.emit(ADD_BIND, routing);
    }

	  this.connections[routing].push(connectionId);
  }
  
  delBindAll(delId) {
    return _.reduce(this.connections, (newConnections, connectionIds, routing) => {
      const newConnectionIds = _.filter(connectionIds, connId => connId != delId);
      if (newConnectionIds.length > 0) {
        newConnections[routing] = newConnectionIds;
      }
      this.delRoutingIfNeeded(routing);
      return newConnections;
    }, {});
  }

  delBind(connectionId, routing) {
  	if (!this.connections[routing])
	  	return

    this.connections[routing] = _.filter(this.connections[routing], c => c !== connectionId);
    this.delRoutingIfNeeded(routing);
  }

  delRoutingIfNeeded(routing) {
    if (this.connections[routing].length == 0) {
      delete this.connections[routing];
      this.emit(DEL_BIND, routing);
    }
  }
}


module.exports = BindStore