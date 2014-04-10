'use strict';

var fs = require('fs');

/**
 * @desc get all configs paths from directory specified in 'path' argument
 * @param absolutePath {string} - absolute path to configs directory
 * @returns {object} - object containing paths to config files
 */

function getConfigs(absolutePath) {
	var configs = {};

	fs.readdirSync(absolutePath).forEach(function(config) {
		if (config.match(/.+\.config\.js$/g) !== null) {
			var name = config.replace('.config.js', '');
			configs[name] = absolutePath + config;
		}
	});

	return configs;
}

/**
 * @desc require config modules
 * @param configs {object} - object with path to config files
 * @returns {object} - object with config modules
 */

function requireConfigs(configs) {
	var configModules = {};

	Object.keys(configs).forEach(function(value) {
		configModules[value] = require(configs[value]);
	});

	return configModules;
}

module.exports = {
	getConfigs: getConfigs,
	requireConfigs: requireConfigs
};
