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
	poiCrudUtils;

function getPoiCrudUtilsMock(dbConStub, taskQueueStub, loggerStub, poiConfigStub) {
	return proxyquire('../api/v1/poi.utils', {
		'./../../lib/db_connector': dbConStub,
		'./../../lib/taskQueue': taskQueueStub,
		'./../../lib/logger': loggerStub,
		'./poi.config': poiConfigStub
	});
}

describe('poi.utils.js', function () {
	it('passes proper where options while executing getMapIdByPoiId()', function () {
		poiCrudUtils = getPoiCrudUtilsMock(dbConStub, taskQueueStub, loggerStub, poiConfigStub);
		poiCrudUtils.getMapIdByPoiId({}, 123);
	});

	it('works properly while executing addPoiDataToQueue() for POI deletion', function () {
		var taskQueueStub = {
			tasks: {
				poiUpdate: 'update'
			},
			publish: function () {},
			payload: function (taskType, createdBy, workId, context) {
				expect(createdBy).toEqual('');
				expect(workId).toEqual('delete' + 123);
				expect(context).toEqual({
					operation: 'delete',
					data: [
						{
							id: 123
						}
					]
				});
			}
		};

		poiCrudUtils = getPoiCrudUtilsMock(dbConStub, taskQueueStub, loggerStub, poiConfigStub);
		poiCrudUtils.addPoiDataToQueue({}, poiConfigStub.poiOperations.delete, 123);
	});
});
