const fs =require('fs');
const path = require('path');
const _ = require('_');

module.exports = function (routing) {
	const baseFile = path.join(__dirname, '..', '/base.json')
	const connections = JSON.parse(fs.readFileSync(baseFile));
	
	return _.chain(connections).filter((c, r) => {
		return (r === routing) || routing.match('/' + r + '/');
	}).map((c, r) => { return c; }).value();
}