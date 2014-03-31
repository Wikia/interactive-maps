var cluster = require('cluster'),
	numCPUs = require('os').cpus().length,
	fs = require('fs'),
	config = require('./lib/config'),
	tmp = process.cwd() + config.tmp;

if (cluster.isMaster) {
	// Fork workers.
	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

	//setup folders
	if (!fs.existsSync(tmp)) {
		fs.mkdirSync(tmp);
	}

	require('./kueServer');
	require('./apiServer');
} else {
	require('./lib/jobProcessors');
}

