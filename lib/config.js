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
	charset = 'utf8',
	// service name known by Fastly
	serviceName = 'interactive-maps',
	dfsProxyKey = 'dfsProxy',
	swiftEnv;

if (!env.WIKIA_CONFIG_ROOT) {
	throw 'WIKIA_CONFIG_ROOT seems to be not set';
}

if (!env.WIKIA_PROD_DATACENTER) {
	throw 'WIKIA_PROD_DATACENTER seems to be not set';
}

if (!env.NODE_ENV) {
	throw 'NODE_ENV seems to be not set';
}

confPath = env.WIKIA_CONFIG_ROOT + '/InteractiveMapsConfig.json';
swiftConf = env.WIKIA_CONFIG_ROOT + '/Settings.yml';
environment = env.NODE_ENV || 'production';

try {
	configuration = require(confPath);
	configuration.api.port = configuration.api[environment].port;
	configuration.api.token = configuration.api[environment].token;
	configuration.db = configuration.db[environment];
	configuration.dfsHost = configuration.api[environment].dfsHost;
	configuration.client = configuration.client[environment];
	
	// Set DFS Proxy settings if defined in config
	if (configuration.api[environment].hasOwnProperty(dfsProxyKey)) {
		configuration.useDfsProxy = true;
		configuration.dfsProxy = configuration.api[environment][dfsProxyKey];
	}

	swiftConfiguration = yaml.safeLoad(
		fs.readFileSync(swiftConf, charset)
	);

	logger.debug('Using conf file: ' + confPath + ' for process id: ' + process.pid);
	logger.debug('Using swift conf file: ' + swiftConf + ' for process id: ' + process.pid);
} catch (e) {
	throw 'Problem with config: ' + e;
}

// Settings.yml naming is different from the rest of our code
switch (environment) {
	case 'staging':
	case 'production':
		swiftEnv = 'prod';
		break;

	default:
		swiftEnv = 'dev';
}
configuration.swift = swiftConfiguration.wgFSSwiftDC[swiftEnv][env.WIKIA_PROD_DATACENTER.toLowerCase()];

configuration.setRoot = function (dir) {
	configuration.root = dir || '';
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
configuration.getAssetsUrlPart = function () {
	return '/assets/' + this.getCachebusterUrlPart();
};

/**
 * @desc Returns part of the path with current cache buster
 *
 * @returns {string}
 */
configuration.getCachebusterUrlPart = function () {
	return '__cb' + this.getCachebuster();
};

/**
 * @desc Returns service name known by Fastly
 *
 * @returns {string}
 */
configuration.getServiceName = function () {
	return serviceName;
}

module.exports = configuration;
