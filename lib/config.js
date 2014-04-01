'use strict';

var yaml = require('js-yaml'),
	fs = require('fs'),
	settings = require('./../settings'),
	configuration;

try {
	configuration = yaml.safeLoad(
		fs.readFileSync(
			(settings.configPath || process.env.CONFIG) + '/interactiveMapsConfig.yml',
			'utf8'
		)
	);
} catch (e) {
	console.log('Problem with config', e);
	process.exit();
}

configuration.setRoot = function(dir){
	dir = dir || '';

	configuration.tmp = dir + configuration.tmp;
	configuration.root = dir;
};

module.exports = configuration;
