#!/usr/bin/env node
'use strict';

var healthCheck = require(__dirname + '/../lib/healthCheck'),
	// TODO: These values are currently just wild guesses, change them when we have some tests
	responseTimeThresholds = {
		1000: healthCheck.exitCodes.OK,
		2000: healthCheck.exitCodes.WARNING,
		5000: healthCheck.exitCodes.CRITICAL
	},
	hostnameToCheck = 'localhost';

try {
	healthCheck.getApiHeartbeat(hostnameToCheck, responseTimeThresholds, healthCheck.printResult);
}
catch (e) {
	healthCheck.printResult({
		code: healthCheck.exitCodes.CRITICAL,
		message: e.message
	});
}
