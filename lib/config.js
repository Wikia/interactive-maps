'use strict';

var yaml = require('js-yaml'),
	logger = require('./logger'),
	fs = require('fs'),
	configuration,
	swiftConfiguration,
	confPath,
	swiftConf,
	env = process.env,
	environment,
	charset = 'utf8';

if (!env.WIKIA_CONFIG_ROOT) {
	throw 'WIKIA_CONFIG_ROOT seems to be not set';
}

if (!env.WIKIA_SWIFT_YML) {
	throw 'WIKIA_SWIFT_YML seems to be not set';
}

if (!env.WIKIA_PROD_DATACENTER) {
	throw 'WIKIA_PROD_DATACENTER seems to be not set';
}

if (!env.NODE_ENV) {
	throw 'NODE_ENV seems to be not set';
}

confPath = env.WIKIA_CONFIG_ROOT + '/InteractiveMapsConfig.json';
swiftConf = env.WIKIA_SWIFT_YML;
environment = env.NODE_ENV || 'production';

try {
	configuration = require(confPath);
	configuration.api.port = configuration.api[environment].port;
	configuration.api.token = configuration.api[environment].token;

	swiftConfiguration = yaml.safeLoad(
		fs.readFileSync(swiftConf, charset)
	);

	logger.debug('Using conf file: ' + confPath + ' for process id: ' + process.pid);
	logger.debug('Using swift conf file: ' + swiftConf + ' for process id: ' + process.pid);
} catch (e) {
	throw 'Problem with config: ' + e;
}

configuration.swift = swiftConfiguration.wgFSSwiftConfig[environment][env.WIKIA_PROD_DATACENTER];

configuration.setRoot = function (dir) {
	dir = dir || '';

	configuration.tmp = dir + configuration.tmp;
	configuration.root = dir;
};

/**
 * @desc Gets cache buster value from cachebuster.json file
 *
 * @returns {integer}
 */
configuration.getCachebuster = function () {
	if( !configuration.root ) {
		throw 'Root directory not set!';
	}

	if( !configuration.cachebuster ) {
		var cacheBusterFile = require(configuration.root + '/cachebuster.json');
		configuration.cachebuster = cacheBusterFile.cb;
	}

	return configuration.cachebuster;
};

/**
 * @desc Returns part of the path to the assets URLs
 *
 * @returns {string}
 */
configuration.getCachebusterUrlPart = function () {
	return '/__cb' + this.getCachebuster();
}

module.exports = configuration;
