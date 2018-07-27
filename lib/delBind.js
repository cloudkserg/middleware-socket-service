const fs =require('fs');
const path = require('path');
const _ = require('_');

module.exports = function (connectionId, routing) {
	const baseFile = path.join(__dirname, '..', '/base.json')
	const connections = JSON.parse(await fs.readFile(baseFile));

	if (!routing) {
		connections = _.filter(connections, c => {
			return c!== connectionId;
		});
	}


	if (!connections[routing])
		return

  connections[routing] = _.filter(connections[routing], c => {
    return c !== connectionId;
  })


	await fs.writeFile(JSON.stringify(connections))
}