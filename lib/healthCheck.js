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
	nagiosHealthCheckEntryPoint = 'healthcheck_nagios',
	healthCheckOkMessage = 'Server status is: OK',
	httpTimeout = 1000,
	healthCheckResponses = {
		'varnish': {
			0: {
				httpCode: 200,
				httpBody: healthCheckOkMessage
			},
			1: {
				httpCode: 200,
				httpBody: healthCheckOkMessage
			},
			2: {
				httpCode: 200,
				httpBody: healthCheckOkMessage
			},
			3: {
				httpCode: 503,
				httpBody: 'Server status is: FAILED - database down'
			}
		},
		'nagios': {
			0: {
				httpCode: 200,
				httpBody: healthCheckOkMessage
			},
			1: {
				httpCode: 503,
				httpBody: 'WARNING - read only mode'
			},
			2: {
				httpCode: 503,
				httpBody: 'WARNING - slave is down'
			},
			3: {
				httpCode: 503,
				httpBody: 'CRITICAL - database down'
			}
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
				conn.release();
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
 * @param {string} checkType flag which describes what health check type it is: varnish or nagios
 */
function getHeartbeat(res, checkType) {
	Q.allSettled([
		getDbNodeHeartbeat(dbCon.connType.master, mysqlMasterFailed),
		getDbNodeHeartbeat(dbCon.connType.slave, mysqlSlaveFailed)
	]).then(function (results) {
		var resultSum = 0;

		results.forEach(function (result) {
			resultSum += result.value;
		});

		res.send(
			healthCheckResponses[checkType][resultSum].httpCode,
			healthCheckResponses[checkType][resultSum].httpBody
		);
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
			executionTime = process.hrtime(startTime);
			if (res.statusCode === 200) {
				result = getCheckResult(
					responseTimeThreshold,
					utils.hrTimeToMilliseconds(executionTime),
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
		.on('error', function (e) {
			result = {
				code: exitCodes.CRITICAL,
				message: e.message
			};
			callback(result);
		})
		.setTimeout(httpTimeout, function () {
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
			getHeartbeat(res, 'varnish');
		});

		app.get('/' + nagiosHealthCheckEntryPoint, function (req, res) {
			getHeartbeat(res, 'nagios');
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
