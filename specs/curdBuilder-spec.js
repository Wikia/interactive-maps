'use strict';

var curdBuilder = require('../lib/curdBuilder');

describe('curdBuilder', function () {
	var config = {
		dbTable: 'test',
		dbColumns: ['test']
	};

	it('throws an exteption when config is not provided', function () {
		expect(
			function () {
				curdBuilder.createCURD();
			})
			.toThrow(new Error('Config must be an object!'));
	});

	it('throws an exteption when config.dbTable is not set', function () {
		expect(
			function () {
				curdBuilder.createCURD({});
			})
			.toThrow(new Error('Config properties "dbTable" and "dbColumns" are required!'));
	});
});
