'use strict';

var yaml = require('js-yaml'),
	fs = require('fs'),
	settings = require('./../settings');

try {
	module.exports = yaml.safeLoad(
		fs.readFileSync(
			(settings.configPath || process.env.CONFIG) + '/interactiveMapsConfig.yml',
			'utf8'
		)
	);
} catch (e) {
	console.log('Problem with config', e);
	process.exit();
}
