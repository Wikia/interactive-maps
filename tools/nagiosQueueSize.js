#!/usr/bin/env node
'use strict';

var healthCheck = require(__dirname + '/../lib/healthCheck'),
	// TODO: These values are currently just wild guesses, change them when we have some tests
	inactiveThresholds = {
		20: healthCheck.exitCodes.OK,
		40: healthCheck.exitCodes.WARNING,
		60: healthCheck.exitCodes.CRITICAL
	};

try {
	healthCheck.getQueueSize(inactiveThresholds, healthCheck.printResult);
}
catch (e) {
	healthCheck.printResult({
		code: healthCheck.exitCodes.CRITICAL,
		message: e.message
	});
}
