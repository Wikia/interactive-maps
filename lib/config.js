'use strict';

var yaml = require('js-yaml'),
	fs = require('fs');

try {
	module.exports = yaml.safeLoad(fs.readFileSync(process.env.CONFIG_PATH + 'interactiveMapsConfig.yml', 'utf8'));
} catch (e) {
	console.log('Problem with config', e);
	process.exit();
}
