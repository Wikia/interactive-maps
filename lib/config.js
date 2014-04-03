'use strict';

var yaml = require('js-yaml'),
	fs = require('fs'),
	settings = require('./../settings'),
	logger = require('./logger'),
	configuration;

try {
	configuration = yaml.safeLoad(
		fs.readFileSync(
			(settings.configPath || process.env.CONFIG) + 'interactiveMapsConfig.yml',
			'utf8'
		)
	);
} catch (e) {
	var error = 'Problem with config: ' + e;
	logger.error(error);
	throw error;
}

configuration.setRoot = function(dir){
	dir = dir || '';

	configuration.tmp = dir + configuration.tmp;
	configuration.root = dir;
};

module.exports = configuration;
