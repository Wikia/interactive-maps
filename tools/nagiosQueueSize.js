'use strict';

var healthCheck = require(__dirname + '/../lib/healthCheck'),
	// TODO: These values are currently just wild guesses, change them when we have some tests
	inactiveThresholds = {
		20: healthCheck.exitCodes.OK,
		40: healthCheck.exitCodes.WARNING,
		60: healthCheck.exitCodes.CRITICAL
	};

function printResult(result) {
	console.log(result.message);
	process.exit(result.code);
}

healthCheck.getQueueSize(inactiveThresholds, printResult);
