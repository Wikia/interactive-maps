'use strict';

if (process.env.NEW_RELIC_ENABLED === 'true') {
	require('newrelic');
}

var logger = require('./lib/logger'),
	cluster = require('cluster'),
	numCPUs = require('os').cpus().length,
	fs = require('fs'),
	config,
	kue = require('kue'),
	jobs;

config = require('./lib/config');

config.setRoot(__dirname);

jobs = kue.createQueue(config);


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
 * @desc Called on exit to cleanup kue and close it
 */
function shutdown(){
	jobs.shutdown(function () {
		logger.debug('Jobs cleaned up and set to delayed states');
		logger.close();
		process.exit(0);
	}, 1000);
}

/**
 * @desc called on SIGINT or SIGTERM to deactivate jobs
 */
function onDie() {
	//when terminating: mark all active jobs as delayed
	//so kue can pick them up after restart
	jobs.active(function (err, ids) {
		var length = ids.length,
			count = 0,
			i = 0,
			delayJob = function (err, job) {
				job.delayed().save();
				count++;

				if (count === length) {
					shutdown();
				}
			};

		if (length) {
			for (; i < length; i++) {
				kue.Job.get(ids[i], delayJob);
			}
		} else {
			shutdown();
		}
	});
}

if (cluster.isMaster) {

	// Fork workers.
	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

	//setup folders
	if (!fs.existsSync(config.tmp)) {
		fs.mkdirSync(config.tmp);
	}

	process.on('SIGINT', onDie);
	process.on('SIGTERM', onDie);

	//jobs are added with delayed status
	// we need to check if something should get promoted
	//by default it happens every 5000ms
	jobs.promote();

	require('./apiServer');
} else {
	require('./lib/jobProcessors');
}
