var logger = require('./lib/logger'),
	cluster = require('cluster'),
	numCPUs = require('os').cpus().length,
	fs = require('fs'),
	config;

logger.set({
	console: {
		enabled: true,
		level: logger.level.DEBUG,
		raw: true
	}
});

config = require('./lib/config');

config.setRoot(__dirname);

if (cluster.isMaster) {

	// Fork workers.
	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

	//setup folders
	if (!fs.existsSync(config.tmp)) {
		fs.mkdirSync(config.tmp);
	}

	require('./apiServer');
} else {
	require('./lib/jobProcessors');
}
