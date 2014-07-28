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
 * @desc Sends a simple DB query to DB server
 *
 * @param {string} type DB connection type master or slave or all; if nothing is passed it sends query to slave
 * @returns {object} promise
 */
function getDbNodeHeartbeat(type) {
	var deferred = Q.defer(),
		connType = (typeof type === 'undefined') ? dbCon.connType.slave : type;

	dbCon.getConnection(connType)
		.then(function (conn) {
			dbCon.knex.raw('select 1').connection(conn).then(function () {
				deferred.resolve();
			});
		})
		.
	catch (function () {
		deferred.reject();
	});

	return deferred.promise;
}

/**
 * @desc Sends simple DB query to check if DB is up
 *
 * @param {object} res response object from express
 */
function getDbHeartbeat(res) {
	var masterUp = false,
		slaveUp = false,
		message;

	getDbNodeHeartbeat(dbCon.connType.master)
		.then(function () {
			masterUp = true;
		})
		.then(getDbNodeHeartbeat)
		.then(function () {
			slaveUp = true;
			res.set(healthCheckHttpHeader, healthCheckOkMessage);
			res.send(200, healthCheckOkMessage);
		})
		.
	catch (function () {
		if (!masterUp && !slaveUp) {
			// both Varnish & Nagios need to know that - that's why HTTP header and body message are the same
			message = 'Server status is: FAILED - database down';
			res.set(healthCheckHttpMessageHeader, message);
			res.set(healthCheckHttpCodeHeader, exitCodes.CRITICAL);
			res.send(503, message);
		}

		if (!masterUp && slaveUp) {
			// Varnish should still accept responses because we're in read-only mode
			// but let inform Nagios that something is going wrong with master
			message = 'Server status is: WARNING - read only mode';
			res.set(healthCheckHttpMessageHeader, message);
			res.set(healthCheckHttpCodeHeader, exitCodes.WARNING);
			res.send(200, healthCheckOkMessage);
		}

		if (masterUp && !slaveUp) {
			// Varnish should still accept responses because we're reading&writing from master
			// but let inform Nagios that something is going wrong with slaves and replication is broken
			message = 'Server status is: WARNING - slave is down';
			res.set(healthCheckHttpMessageHeader, message);
			res.set(healthCheckHttpCodeHeader, exitCodes.WARNING);
			res.send(200, healthCheckOkMessage);
		}
	})
		.done();
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
			var exitCode = res.headers[healthCheckHttpCodeHeader];

			if (exitCode != exitCodes.OK) {
				result = {
					code: exitCode,
					message: res.headers[healthCheckHttpMessageHeader]
				};
			} else {
				executionTime = process.hrtime(startTime);
				if (res.statusCode === 200) {
					result = getCheckResult(
						responseTimeThreshold,
						utils.hrTimeToMilliseconds(executionTime),
						'ms response time (' + res.headers[healthCheckHttpMessageHeader] + ')'
					);
				} else {
					result = {
						code: exitCodes.CRITICAL,
						message: 'HTTP Code ' + res.statusCode + ' (' + res.headers[healthCheckHttpMessageHeader] + ')'
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
