'use strict';

var proxyquire = require('proxyquire').noCallThru();

describe('poi.utils.js', function () {
	it('passes proper where options while executing getMapIdByPoiId()', function () {
		var dbConStub = {
				select: function (conn, table, fields, where) {
					expect(where).toEqual({
						id: 123
					});
				}
			},
			poiCrudUtils = proxyquire('../api/v1/poi.utils', {
				'./../../lib/db_connector': dbConStub,
				'./../../lib/taskQueue': {},
				'./../../lib/logger': {},
				'./poi.config': {}
			});

		poiCrudUtils.getMapIdByPoiId({}, 123);
	});
});
