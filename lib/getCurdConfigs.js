'use strict';

var fs = require('fs');

/**
 * @desc get all configs paths from directory specified in 'path' argument
 * @param dirPath {string} - path to configs directory relative to root (exp. "/api/v1/")
 * @returns {object} - object containing paths to config files
 */

function getConfigs(dirPath) {
	var rootPath = process.cwd(),
		absolutePath = rootPath + dirPath,
		configs = {};

	fs.readdirSync(absolutePath).forEach(function(config) {
		if (config.match(/.+\.config\.js$/g) !== null) {
			var name = config.replace('.config.js', '');
			configs[name] = rootPath + dirPath + config;
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

// Public API

module.exports = {
	getConfigs: getConfigs,
	requireConfigs: requireConfigs
};
