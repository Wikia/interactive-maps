'use strict';

var proxyquire = require('proxyquire').noCallThru(),
	errorHandler = jasmine.createSpyObj('errorHandler', ['badNumberError', 'badRequestError', 'elementNotFoundError']),
	jsonValidator = jasmine.createSpyObj('jsonValidator', ['validateJSON']),
	crudUtils = proxyquire('../api/v1/crud.utils', {
		'./../../lib/errorHandler': errorHandler,
		'./../../lib/jsonValidator': jsonValidator
	});

describe('CRUD utils', function () {
	it('add pagination to query', function () {
		var queryMock = jasmine.createSpyObj('queryMock', ['limit', 'offset']),
			limit = 1,
			offset = 2;

		queryMock.limit.andReturn(queryMock);
		crudUtils.addPaginationToQuery(queryMock, limit, offset);

		expect(queryMock.limit).toHaveBeenCalledWith(limit);
		expect(queryMock.offset).toHaveBeenCalledWith(offset);
	});

	it('throws error for infinite id value', function () {
		var infiniteNum = 1.7976931348623157E+10308,
			errorMsg = 'test';

		errorHandler.badNumberError.andReturn(new Error(errorMsg));

		expect(function () {
			crudUtils.validateIdParam(infiniteNum);
		}).toThrow(errorMsg);
		expect(errorHandler.badNumberError).toHaveBeenCalledWith(infiniteNum);
	});

	it('throws error for id <= 0', function () {
		var ids = [-1, 0],
			errorMsg = 'Invalid id';

		errorHandler.badRequestError.andReturn(new Error(errorMsg));

		ids.forEach(function (value) {
			expect(function () {
				crudUtils.validateIdParam(value);
			}).toThrow(errorMsg);
			expect(errorHandler.badRequestError).toHaveBeenCalledWith(errorMsg);
		});
	});

	it('it throws error if data validation fail', function () {
		var reqBody = {},
			schema = {},
			errorsMock = [1, 2, 3],
			errorMsg = 'test';

		jsonValidator.validateJSON.andReturn(errorsMock);
		errorHandler.badRequestError.andReturn(new Error(errorMsg));

		expect(function () {
			crudUtils.validateData(reqBody, schema);
		}).toThrow(errorMsg);
		expect(errorHandler.badRequestError).toHaveBeenCalledWith(errorsMock);
	});

	it('throws error is no rows where affected', function () {
		var affectedRows = 0,
			crudConfig = {
				dbTable: {}
			},
			id = 1,
			errorMsg = 'test';

		errorHandler.elementNotFoundError.andReturn(errorMsg);

		expect(function () {
			crudUtils.throwErrorIfNoRowsAffected(affectedRows, crudConfig, id);
		}).toThrow(errorMsg);
		expect(errorHandler.elementNotFoundError).toHaveBeenCalledWith(crudConfig.dbTable, id);
	});

	it('releases db connection on fail', function () {
		var conn = jasmine.createSpyObj('conn', ['release']),
			next = jasmine.createSpy('next');

		crudUtils.releaseConnectionOnFail(conn, next);

		expect(conn.release).toHaveBeenCalled();
		expect(next).toHaveBeenCalled();
	});
});