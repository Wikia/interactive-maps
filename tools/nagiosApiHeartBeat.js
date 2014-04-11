#!/usr/bin/env node
'use strict';

var healthCheck = require(__dirname + '/../lib/healthCheck'),
	// TODO: These values are currently just wild guesses, change them when we have some tests
	responseTimeThresholds = {
		1000: healthCheck.exitCodes.OK,
		2000: healthCheck.exitCodes.WARNING,
		5000: healthCheck.exitCodes.CRITICAL
	};

function printResult(result) {
	console.log(result.message);
	process.exit(result.code);
}
try {
	healthCheck.getApiHeartbeat(responseTimeThresholds, printResult);
}
catch (e) {
	printResult({
		code: healthCheck.exitCodes.CRITICAL,
		message: e.message
	});
}
