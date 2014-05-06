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
		errorHandler.errorHandler(
			stubErr(400, 'error'),
			stubReq(),
			stubRes(400, 'error')
		);

		errorHandler.errorHandler(
			stubErr(502, 'error1'),
			stubReq(),
			stubRes(502, 'error1')
		);

		errorHandler.errorHandler(
			stubErr(404, 'error2'),
			stubReq(),
			stubRes(404, 'error2')
		);
	});

	it('should use status 500 by default', function () {
		errorHandler.errorHandler(
			stubErr(undefined, 'error'),
			stubReq(),
			stubRes(500, 'error')
		)
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

		errorHandler.errorHandler(
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

		errorHandler.errorHandler(
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

	it('should handle foreign key errors in sql', function () {
		errorHandler.errorHandler({
				clientError: {
					name: 'RejectionError',
					cause: {
						code: 'ER_NO_REFERENCED_ROW'
					}
				}
			},
			stubReq(),
			stubRes(500, {
				message: 'Cannot create reference to non-existing value'
			})
		);
	});

	it('should handle duplicate unique key error in database', function () {
		errorHandler.errorHandler({
				clientError: {
					name: 'RejectionError',
					cause: {
						code: 'ER_DUP_ENTRY'
					}
				}
			},
			stubReq(),
			stubRes(500, {
				message: 'Name needs to be unique'
			})
		);
	});

	it('should handle delete referred', function () {
		errorHandler.errorHandler({
				clientError: {
					name: 'RejectionError',
					cause: {
						code: 'ER_ROW_IS_REFERENCED_'
					}
				}
			},
			stubReq(),
			stubRes(500, {
				message: 'Trying to delete row which is referenced'
			})
		);
	});

	it('should handle general sql errors', function () {
		errorHandler.errorHandler({
				clientError: {
					name: 'SQL Error'
				}
			},
			stubReq(),
			stubRes(500, {
				message: 'General database error'
			})
		);
	});

	it('generates valid error messages', function () {
		var testCases = [{
			function: 'badNumberError',
			params: ['as'],
			result: {
				status: 400,
				message: {
					message: 'Bad request',
					details: 'id: as should be a number'
				}
			}
		}, {
			function: 'badRequestError',
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
			function: 'elementNotFoundError',
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
			var funct = errorHandler[testCase.function];
			expect(
				JSON.stringify(funct.apply(funct, testCase.params))
			).toBe(
				JSON.stringify(testCase.result)
			);
		});
	});

});
