/* global jasmine */
'use strict';

var proxyquire = require('proxyquire').noCallThru(),
	errorHandler = proxyquire('../lib/errorHandler', {
		'./logger': {
			error: function () {

			},
			getContext: function (status, req) {
				return {
					status: status,
					req: req
				};
			}
		}
	}),
	stubReq = function () {
		return {};
	},
	stubRes = function (status, message) {
		return {
			status: function (resStatus) {
				expect(status).toEqual(resStatus);
			},
			send: function (resMessage) {
				expect(message).toEqual(resMessage);
			},
			end: function () {

			}
		};
	},
	stubErr = function (status, message) {
		return {
			status: status,
			message: message
		};
	};

describe('errorHandler module', function () {
	it('should response with appropriate status end message', function () {
		errorHandler.middleware(
			stubErr(400, 'error'),
			stubReq(),
			stubRes(400, 'error')
		);

		errorHandler.middleware(
			stubErr(502, 'error1'),
			stubReq(),
			stubRes(502, 'error1')
		);

		errorHandler.middleware(
			stubErr(404, 'error2'),
			stubReq(),
			stubRes(404, 'error2')
		);
	});

	it('should use status 500 by default', function () {
		errorHandler.middleware(
			stubErr(undefined, 'error'),
			stubReq(),
			stubRes(500, 'error')
		);
	});

	it('should log the error', function () {
		var error = jasmine.createSpy('error'),
			errorHandler = proxyquire('../lib/errorHandler', {
				'./logger': {
					error: error,
					getContext: function (data) {
						return {
							response: data.response,
							req: data.req
						};
					}
				}
			});

		errorHandler.middleware(
			stubErr(418, 'I\'m a teapot'),
			stubReq(),
			stubRes(418, 'I\'m a teapot')
		);

		expect(error).toHaveBeenCalled();
		expect(error.callCount).toEqual(1);
		expect(error).toHaveBeenCalledWith('I\'m a teapot', {
			response: 418,
			req: {}
		});

		errorHandler.middleware(
			stubErr(404, 'Not found'),
			stubReq(),
			stubRes(404, 'Not found')
		);

		expect(error.callCount).toEqual(2);
		expect(error).toHaveBeenCalledWith('Not found', {
			response: 404,
			req: {}
		});
	});

	it('should handle sql errors', function () {
		var testCases = [
			{
				clientError: {
					name: 'RejectionError',
					cause: {
						code: 'ER_NO_REFERENCED_ROW'
					}
				},
				expected: {
					code: 500,
					message: {
						message: 'Cannot create reference to non-existing value',
						code: 'ER_NO_REFERENCED_ROW'
					}
				}
			},
			{
				clientError: {
					name: 'RejectionError',
					cause: {
						code: 'ER_DUP_ENTRY'
					}
				},
				expected: {
					code: 500,
					message: {
						message: 'Name needs to be unique',
						code: 'ER_DUP_ENTRY'
					}
				}
			},
			{
				clientError: {
					name: 'RejectionError',
					cause: {
						code: 'ER_ROW_IS_REFERENCED_'
					}
				},
				expected: {
					code: 500,
					message: {
						message: 'Trying to delete row which is referenced',
						code: 'ER_ROW_IS_REFERENCED_'
					}
				}
			},
			{
				clientError: {
					name: 'OperationalError',
					cause: {
						code: 'ER_NO_REFERENCED_ROW'
					}
				},
				expected: {
					code: 500,
					message: {
						message: 'Cannot create reference to non-existing value',
						code: 'ER_NO_REFERENCED_ROW'
					}
				}
			},
			{
				clientError: {
					name: 'OperationalError',
					cause: {
						code: 'ER_DUP_ENTRY'
					}
				},
				expected: {
					code: 500,
					message: {
						message: 'Name needs to be unique',
						code: 'ER_DUP_ENTRY'
					}
				}
			},
			{
				clientError: {
					name: 'OperationalError',
					cause: {
						code: 'ER_ROW_IS_REFERENCED_'
					}
				},
				expected: {
					code: 500,
					message: {
						message: 'Trying to delete row which is referenced',
						code: 'ER_ROW_IS_REFERENCED_'
					}
				}
			},
			{
				clientError: {
					name: 'SQL Error'
				},
				expected: {
					code: 500,
					message: {
						message: 'General database error'
					}
				}
			}
		];
		testCases.forEach(function (testCase) {
			errorHandler.middleware({
					clientError: testCase.clientError
				},
				stubReq(),
				stubRes(testCase.expected.code, testCase.expected.message)
			);
		});

	});

	it('generates valid error messages', function () {
		var testCases = [{
			testFunction: 'badNumberError',
			params: ['as'],
			result: {
				status: 400,
				message: {
					message: 'Bad request',
					details: 'id: as should be a number'
				}
			}
		}, {
			testFunction: 'badRequestError',
			params: [
				[1, 2, 3]
			],
			result: {
				status: 400,
				message: {
					message: 'Bad request',
					details: [
						1, 2, 3
					]
				}
			}
		}, {
			testFunction: 'elementNotFoundError',
			params: ['name', 'id'],
			result: {
				status: 404,
				message: {
					message: 'name not found',
					details: 'id: id not found'
				}
			}
		}];
		testCases.forEach(function (testCase) {
			var testFunction = errorHandler[testCase.testFunction];
			expect(
				JSON.stringify(testFunction.apply(testFunction, testCase.params))
			).toBe(
				JSON.stringify(testCase.result)
			);
		});
	});

	it('checks correctly which errors are handled', function () {
		var testCases = [
			{
				errorName: 'OperationalError',
				expected: true
			}, {
				errorName: 'RejectionError',
				expected: true
			}, {
				errorName: 'WhateverError',
				expected: false
			}
		];
		testCases.forEach(function (testCase) {
			expect(errorHandler.isHandledSQLError(testCase.errorName)).toBe(testCase.expected);
		});
	});

});
