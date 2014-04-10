'use strict';

describe('Health Check', function () {

	var proxyquire = require('proxyquire').noCallThru(),
		error = null,
		queueSize = 20,
		healthCheck = proxyquire('./../lib/healthCheck', {
			'./config': {},
			'kue': {
				createQueue: function () {
					return {
						inactiveCount: function (callback) {
							callback(error, queueSize);
						}
					};
				}
			}
		});

	it('is module', function () {
		expect(typeof healthCheck).toBe('object');
	});

	it('exports exit codes', function () {
		expect(typeof healthCheck.exitCodes).toBe('object');
	});

	it('returns proper result code depending on the thresholds', function () {
		var testCases = [{
			thresholds: {
				20: healthCheck.exitCodes.OK
			},
			expectedCode: healthCheck.exitCodes.OK
		}, {
			thresholds: {
				10: healthCheck.exitCodes.OK,
				20: healthCheck.exitCodes.WARNING
			},
			expectedCode: healthCheck.exitCodes.WARNING
		}, {
			thresholds: {
				5: healthCheck.exitCodes.OK,
				10: healthCheck.exitCodes.WARNING,
				20: healthCheck.exitCodes.CRITICAL
			},
			expectedCode: healthCheck.exitCodes.CRITICAL
		}];
		testCases.forEach(function (testCase) {
			healthCheck.getQueueSize(
				testCase.thresholds,
				function (result) {
					expect(result.code).toBe(testCase.expectedCode);
				}
			);
		});
	});

	if ('returns unknown status and proper message if error arises', function () {
		var error = {
			message: 'You shall not pass'
		};
		healthCheck.getQueueSize({},
			function (result) {
				expect(result.code).toBe(healthCheck.exitCodes.UNKNOWN);
				expect(result.message).toBe(error.message);
			}
		);
	});
});
