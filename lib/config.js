'use strict';

var yaml = require('js-yaml'),
	logger = require('./logger'),
	fs = require('fs'),
	utils = require('./utils'),
	configuration,
	mwConfiguration,
	confPath,
	mwSettings,
	env = utils.getProcessEnv(),
	environment,
	charset = 'utf8',
	// service name known by Fastly
	serviceName = 'interactive-maps',
	dfsProxyKey = 'dfsProxy';

if (!env.WIKIA_CONFIG_ROOT) {
	throw new Error('WIKIA_CONFIG_ROOT seems to be not set');
}

if (!env.WIKIA_DATACENTER) {
	throw new Error('WIKIA_DATACENTER seems to be not set');
}

if (!env.NODE_ENV) {
	throw new Error('NODE_ENV seems to be not set');
}

confPath = env.WIKIA_CONFIG_ROOT + '/InteractiveMapsConfig.json';
mwSettings = env.WIKIA_CONFIG_ROOT + '/Settings.yml';
environment = env.NODE_ENV || 'prod';

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

	mwConfiguration = yaml.safeLoad(
		fs.readFileSync(mwSettings, charset)
	);

	logger.debug('Using conf file: ' + confPath + ' for process id: ' + process.pid);
	logger.debug('Using MediaWiki conf file: ' + mwSettings + ' for process id: ' + process.pid);
} catch (e) {
	throw new Error('Problem with config: ' + e);
}

configuration.swift = mwConfiguration.wgFSSwiftDC[environment][env.WIKIA_DATACENTER];

if (configuration.swift.servers.length === 0) {
	throw new Error('Invalid DFS servers list');
}

configuration.taskBroker = mwConfiguration.wgTaskBroker[environment];

configuration.setRoot = function (dir) {
	configuration.root = dir || '';
};

/**
 * @desc Gets cache buster value from cachebuster.json file
 *
 * @returns {integer}
 */
configuration.getCachebuster = function () {
	if (!configuration.root) {
		throw new Error('Root directory not set!');
	}

	if (!configuration.cachebuster) {
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
};

module.exports = configuration;
