'use strict';

var config = require('./config'),
	jobs = require('kue').createQueue(config),
	exitCodes = {
		'OK': 0,
		'WARNING': 1,
		'CRITICAL': 2,
		'UNKNOWN': 3
	};

function getCheckResult(inactiveThresholds, inactiveJobs) {
	var resultCode = exitCodes.CRITICAL,
		limit;
	for (limit in inactiveThresholds) {
		if (inactiveJobs <= limit) {
			resultCode = inactiveThresholds[limit];
			break;
		}
	}
	return {
		code: resultCode,
		message: inactiveJobs + ' inactive jobs in queue'
	};
}

module.exports = {
	getQueueSize: function (inactiveThresholds, callback) {
		jobs.inactiveCount(function (err, val) {
			var result;
			if (err) {
				result = {
					code: exitCodes.UNKNOWN,
					message: err.message
				};
			} else {
				result = getCheckResult(inactiveThresholds, val);
			}
			callback(result);
		});
	},
	exitCodes: exitCodes
}
