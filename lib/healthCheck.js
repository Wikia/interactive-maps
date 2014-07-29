'use strict';

var config = require('./config'),
	utils = require('./utils'),
	http = require('http'),
	Q = require('q'),
	jobs = require('kue').createQueue(config),
	dbCon = require('./db_connector'),
	exitCodes = {
		'OK': 0,
		'WARNING': 1,
		'CRITICAL': 2,
		'UNKNOWN': 3
	},
	heartBeatEntryPoint = 'heartbeat',
	healthCheckHttpMessageHeader = 'x-health-check-message',
	healthCheckHttpCodeHeader = 'x-health-check-code',
	healthCheckOkMessage = 'Server status is: OK',
	healthCheckFailedMessage = 'Server status is: FAILED - database down',
	httpTimeout = 1000,
	healthCheckResponses = {
		0: {
			exitCode: exitCodes.OK,
			nagoisMessage: healthCheckOkMessage,
			responseCode: 200,
			responseMessage: healthCheckOkMessage
		},
		1: {
			exitCode: exitCodes.WARNING,
			nagoisMessage: 'Server status is: WARNING - read only mode',
			responseCode: 200,
			responseMessage: healthCheckOkMessage
		},
		2: {
			exitCode: exitCodes.WARNING,
			nagoisMessage: 'Server status is: WARNING - slave is down',
			responseCode: 200,
			responseMessage: healthCheckOkMessage
		},
		3: {
			exitCode: exitCodes.CRITICAL,
			nagoisMessage: healthCheckFailedMessage,
			responseCode: 503,
			responseMessage: healthCheckFailedMessage
		}
	},
	mysqlResultOk = 0,
	mysqlMasterFailed = 1,
	mysqlSlaveFailed = 2;

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
 * @desc Sends a simple DB query to DB server
 *
 * @param {string} connType DB connection type master or slave or all; if nothing is passed it sends query to slave
 * @param {integer} failureCode code returned by the promise if there is a connection failure
 * @returns {object} promise
 */
function getDbNodeHeartbeat(connType, failureCode) {
	var deferred = Q.defer();

	dbCon.getConnection(connType)
		.then(function (conn) {
			dbCon.knex.raw('select 1').connection(conn).then(function () {
				deferred.resolve(mysqlResultOk);
			});
		})
		.catch (function () {
			deferred.resolve(failureCode);
		});

	return deferred.promise;
}

/**
 * @desc Sends simple DB query to check if DB is up
 *
 * @param {object} res response object from express
 */
function getDbHeartbeat(res) {
	Q.allSettled([
		getDbNodeHeartbeat(dbCon.connType.master, mysqlMasterFailed),
		getDbNodeHeartbeat(dbCon.connType.slave, mysqlSlaveFailed)
	]).then(function (results) {
		var resultSum = 0;

		results.forEach(function (result) {
			resultSum += result.value;
		});

		res.set(healthCheckHttpCodeHeader, healthCheckResponses[resultSum].exitCode);
		res.set(healthCheckHttpMessageHeader, healthCheckResponses[resultSum].nagoisMessage);
		res.send(healthCheckResponses[resultSum].responseCode, healthCheckResponses[resultSum].responseMessage);
	});
}

/**
 * @desc Returns full url to server's heartbeat entry point
 * @returns {string}
 */
function getHeartbeatUrl(hostname) {
	return 'http://' + hostname + ':' + config.api.port + '/' + heartBeatEntryPoint;
}


module.exports = {
	exitCodes: exitCodes,

	/**
	 * @desc Gets the number of inactive queue tasks and callbacks with proper result
	 *
	 * @param {object} inactiveThresholds - object defining the threshold levels
	 * @param {function} callback - function to execute with the result object
	 */
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

	/**
	 * @desc Makes HTTP request to the heartbeat entry point and measures the response time
	 *
	 * @param {string} hostname - hostname to check
	 * @param {object} responseTimeThreshold - object defining the threshold levels
	 * @param {function} callback - function to execute with the result object
	 */
	getApiHeartbeat: function (hostname, responseTimeThreshold, callback) {
		var startTime = process.hrtime(),
			sent = false,
			executionTime,
			result;
		http.get(getHeartbeatUrl(hostname), function (res) {
			var exitCode = (res.headers[healthCheckHttpCodeHeader] ? res.headers[healthCheckHttpCodeHeader] : null),
				nagiosMessage = (res.headers[healthCheckHttpMessageHeader] ? res.headers[healthCheckHttpMessageHeader] : null);

			if (exitCode != exitCodes.OK && exitCode !== null) {
				result = {
					code: exitCode,
					message: nagiosMessage
				};
			} else {
				executionTime = process.hrtime(startTime);
				if (res.statusCode === 200) {
					result = getCheckResult(
						responseTimeThreshold,
						utils.hrTimeToMilliseconds(executionTime),
						'ms response time (' + nagiosMessage + ')'
					);
				} else {
					result = {
						code: exitCodes.CRITICAL,
						message: 'HTTP Code ' + res.statusCode + ' (' + nagiosMessage + ')'
					};
				}
			}

			sent = true;
			callback(result);
		})
			.on('error', function (e) {
				result = {
					code: exitCodes.CRITICAL,
					message: e.message
				};
				callback(result);
			})
			.setTimeout(httpTimeout, function (res) {
				if (!sent) {
					result = {
						code: exitCodes.CRITICAL,
						message: 'Request timeout'
					};
					callback(result);
				}
			});
	},

	/**
	 * @desc Attaches heartBeat entry point
	 *
	 * @param {object} app - express.js app object
	 */
	heartBeatHandler: function (app) {
		app.get('/' + heartBeatEntryPoint, function (req, res) {
			getDbHeartbeat(res);
		});
	},

	/**
	 * @desc Outputs Nagios result message and exits with proper result code
	 *
	 * @param {object} result
	 */
	printResult: function (result) {
		console.log(result.message);
		process.exit(result.code);
	}
};
