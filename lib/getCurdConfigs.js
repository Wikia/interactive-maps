'use strict';

var fs = require('fs');

/**
 * @desc get all configs from files in directory specified in 'path' argument
 * @param path {string} - path to configs directory relative to root (exp. "/api/v1/"
 * @returns {object} - object containing all API entry points configs
 */

function getApiConfigs(path) {
	var absolutePath = process.cwd() + path,
		configs = {};

	fs.readdirSync(absolutePath).forEach(function(config) {
		if (config.match(/.+\.config\.js/g) !== null) {
			var name = config.replace('.config.js', '');
			configs[name] = require(process.cwd() + path + config);
		}
	});

	return configs;
}

module.exports = getApiConfigs;
