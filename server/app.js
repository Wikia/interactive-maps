'use strict';

if (process.env.NEW_RELIC_ENABLED === 'true') {
	// configuration is handled by Chef
	// it sets NEW_RELIC_ENABLED and NEW_RELIC_HOME_PATH variables
	// it also copies newrelic.js configuration file to the right place
	require('newrelic');
}

var logger = require('../lib/logger'),
	utils = require('../lib/utils'),
	cluster = require('cluster'),
	coresCount = require('os').cpus().length,
	workersCount = process.env.WIKIA_IM_WORKERS,
	fs = require('fs'),
	config,
	kue = require('kue'),
	jobs,
	worker,
	gracefulShutdown = false,
	http = require('http');

config = require('../lib/config');
config.setRoot(__dirname + '/..');

/**
 * This value controls the number of simultaneous HTTP connections in the application.
 * Node's default is 5, which leads to slow DFS uploads. Adjust the value if any DFS issues are spotted.
 */
http.globalAgent.maxSockets = 100;

//set up the logger with console transport
logger.set({
	console: {
		enabled: true,
		level: logger.level.DEBUG,
		raw: true
	},
	file: {
		enabled: true,
		level: logger.level.DEBUG,
		raw: true,
		path: 'intMaps.log'
	},
	syslog: {
		enabled: true,
		level: logger.level.DEBUG,
		tag: 'intMaps',
		dev: true
	}
});

/**
 * @desc Get number of workers depending on number of cores
 * @param {number} coresCount Number of CPU cores
 * @returns {number}
 */
function getWorkersCount(coresCount) {
	return (coresCount * 2) - 1;
}

/**
 * @desc called on SIGINT or SIGTERM to deactivate jobs
 */
function onDie() {
	gracefulShutdown = true;
	utils.markJobsAsDelayed(jobs);
}

if (typeof workersCount === 'undefined') {
	workersCount = getWorkersCount(coresCount);
}

if (cluster.isMaster) {
	if (process.send) {
		process.send('Server started'); // it's used by gulp-develop-server
	}

	logger.debug('Started master process, pid: ' + process.pid);

	// Fork workers
	for (var i = 0; i < workersCount; i++) {
		worker = cluster.fork().process;
		logger.debug('Started worker# ' + i + ' process, pid: ' + worker.pid);
	}

	// Handle dying workers (so cruel)
	cluster.on('exit', function (worker) {
		if (!gracefulShutdown) {
			logger.error('worker ' + worker.process.pid + ' died. restart...');
			cluster.fork();
		}
	});

	//setup folders
	if (!fs.existsSync(config.tmp)) {
		fs.mkdirSync(config.tmp);
	}

	process.on('SIGINT', onDie);
	process.on('SIGTERM', onDie);

	jobs = kue.createQueue(config);
	//jobs are added with delayed status
	// we need to check if something should get promoted
	//by default it happens every 5000ms
	jobs.promote();

	require('./apiServer');
} else {
	require('../lib/jobProcessors');
}

process.on('uncaughtException', function (err) {
	logger.critical('uncaughtException: ' + err.message, {
		stack: err.stack
	});
	process.exit(1);
});
