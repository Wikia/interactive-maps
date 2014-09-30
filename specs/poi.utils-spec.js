'use strict';

var proxyquire = require('proxyquire').noCallThru(),
	dbConStub = {},
	taskQueueStub = {
		publish: function () {},
		payload: function () {}
	},
	loggerStub = {},
	poiConfig = {},
	poiCrudUtils = proxyquire('../api/v1/poi.utils', {
		'./../../lib/db_connector': dbConStub,
		'./../../lib/taskQueue': taskQueueStub,
		'./../../lib/logger': loggerStub,
		'./poi.config': poiConfig
	});

xdescribe('poi.utils.js', function () {
});
