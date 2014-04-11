'use strict';

var config = require('./config'),
	http = require('http'),
	jobs = require('kue').createQueue(config),
	exitCodes = {
		'OK': 0,
		'WARNING': 1,
		'CRITICAL': 2,
		'UNKNOWN': 3
	},
	heartBeatEntryPoint = 'heartbeat',
	heartBeatResponse = 'OK',
	httpTimeout = 1000;

/**
 * @desc Generates check result based on threshold limits and value
 * @param {object} thresholds - Threshold table
 * @param {number} value - curernt value
 * @param {string} messageText - message text for the log
 * @returns {{code: number, message: string}}
 */
function getCheckResult(thresholds, value, messageText) {
	var resultCode = exitCodes.CRITICAL,
		limit;
	for (limit in thresholds) {
		if (value <= limit) {
			resultCode = thresholds[limit];
			break;
		}
	}
	return {
		code: resultCode,
		message: value + ' ' + messageText
	};
}

/**
 * @desc Returns full url to server's heartbeat entry point
 * @returns {string}
 */
function getHeartbeatUrl() {
	return 'http://localhost:' + config.api.port + '/' + heartBeatEntryPoint;
}

/**
 * Returns hrtime difference in milliseconds
 * @param hrTimeDiff
 * @returns {number}
 */
function hrTimeToMilliseconds(hrTimeDiff) {
	return Math.ceil(hrTimeDiff[0] * 1000 + hrTimeDiff[0] * 1e-6);
}

module.exports = {
	exitCodes: exitCodes,
	getQueueSize: function (inactiveThresholds, callback) {
		jobs.inactiveCount(function (err, val) {
			var result;
			if (err) {
				result = {
					code: exitCodes.UNKNOWN,
					message: err.message
				};
			} else {
				result = getCheckResult(
					inactiveThresholds,
					val,
					'inactive jobs in queue'
				);
			}
			callback(result);
		});
	},
	getApiHeartbeat: function(responseTimeThreshold, callback) {
		var startTime = process.hrtime(),
			sent = false,
			executionTime,
			result;
		http.get(getHeartbeatUrl(), function(res) {
			executionTime = process.hrtime(startTime);
			if (res.statusCode === 200 ) {
				result = getCheckResult(
					responseTimeThreshold,
					hrTimeToMilliseconds(executionTime),
					'ms response time'
				);
			} else {
				result = {
					code: exitCodes.CRITICAL,
					message: 'HTTP Code ' + res.statusCode
				};
			}
			sent = true;
			callback(result);
		})
		.on('error', function(e) {
			result = {
				code: exitCodes.CRITICAL,
				message: e.message
			};
			callback(result);
		})
		.setTimeout(httpTimeout, function(res) {
			if (!sent) {
				result = {
					code: exitCodes.CRITICAL,
					message: 'Request timeout'
				};
				callback(result);
			}
		});
	},
	heartBeatHandler: function(req, res) {
		res.send(heartBeatResponse);
	}
};
