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
	poiConfig = {
		dbTable: {}
	},
	poiCrudUtils = proxyquire('../api/v1/poi.utils', {
		'./../../lib/db_connector': dbConStub,
		'./../../lib/taskQueue': taskQueueStub,
		'./../../lib/logger': loggerStub,
		'./poi.config': poiConfig
	});

describe('poi.utils.js', function () {
	it('getMapIdByPoiId() passes proper where options', function () {
		poiCrudUtils.getMapIdByPoiId({}, 123);
	});
});
