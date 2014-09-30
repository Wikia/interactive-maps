'use strict';

var proxyquire = require('proxyquire').noCallThru(),
	dbConStub = {
		select: function (conn, table, fields, where) {
			expect(where).toEqual({
				id: 123
			});
		}
	},
	taskQueueStub = {},
	loggerStub = {},
	poiConfigStub = {
		poiOperations: {
			'delete': 'delete',
			'insert': 'insert',
			'update': 'update'
		}
	},
	poiCrudUtils = proxyquire('../api/v1/poi.utils', {
		'./../../lib/db_connector': dbConStub,
		'./../../lib/taskQueue': taskQueueStub,
		'./../../lib/logger': loggerStub,
		'./poi.config': poiConfigStub
	});

describe('poi.utils.js', function () {
	it('passes proper where options while executing getMapIdByPoiId()', function () {
		poiCrudUtils.getMapIdByPoiId({}, 123);
	});
});
