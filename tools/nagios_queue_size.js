'use strict';

var config = require('../lib/config'),
	jobs = require('kue').createQueue(config),
	exitCodes = {
		'OK': 0,
		'WARNING': 1,
		'CRITICAL': 2,
		'UNKNOWN': 3
	},
	// TODO: These values are currently just wild guesses, change them when we have some tests
	inactiveThresholds = {
		20: exitCodes.OK,
		40: exitCodes.WARNING,
		60: exitCodes.CRITICAL
	};

function getCheckResult(inactiveJobs) {
	var resultCode = exitCodes.CRITICAL,
		limit;
	for (limit in inactiveThresholds) {
		if (inactiveJobs <= limit) {
			resultCode = limit;
			break;
		}
	}
	return {
		code: resultCode,
		message: inactiveJobs + ' inactive jobs in queue'
	};
}

function printResult(result) {
	console.log(result.message);
	process.exit(result.code);
}

jobs.inactiveCount(function(err, val) {
	var result;
	if (err) {
		result = {
			code: exitCodes.UNKNOWN,
			message: err.message
		};
	} else {
		result = getCheckResult(val);
	}
	printResult(result);
});


