const fs =require('fs');
const path = require('path');
const _ = require('_');

module.exports = function (connectionId, routing) {
	const baseFile = path.join(__dirname, '..', '/base.json')
	const connections = JSON.parse(await fs.readFile(baseFile));

	if (!connections)
		connections = {}

	if (!connections[routing])
		connections[routing] = []

	connections[routing].push(connectionId);


	await fs.writeFile(JSON.stringify(connections))
}