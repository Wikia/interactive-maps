'use strict';

var proxyquire = require('proxyquire').noCallThru(),
	dbConStub = {},
	errorHandlerStub = {},
	utilsStub = {
		responseUrl: function () {
			return 'mocked response URL';
		},
		addTrailingSlash: function () {}
	},
	qStub = {},
	configStub = {},
	poiConfigStub = {},
	crudUtilsStub = {},
	poiCategoryConfig = require('../api/v1/poi_category.config'),
	poiCategoryUtils = proxyquire('../api/v1/poi_category.utils', {
		'./../../lib/db_connector': dbConStub,
		'./../../lib/errorHandler': errorHandlerStub,
		'./../../lib/utils': utilsStub,
		'q': qStub,
		'./../../lib/config': configStub,
		'./poi.config': poiConfigStub,
		'./crud.utils': crudUtilsStub
	});

describe('poi_category.utils.js', function () {
	it('returns correct object with setupCreatePoiCategoryResponse()', function () {
		var reqStub = {
			route: {
				path: '/'
			}
		};
		expect(poiCategoryUtils.setupCreatePoiCategoryResponse(123, reqStub)).toEqual({
			message: poiCategoryConfig.responseMessages.created,
			id: 123,
			url: 'mocked response URL'
		});
	});
});
