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

module.exports = configuration;
