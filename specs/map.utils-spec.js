'use strict';

var proxyquire = require('proxyquire').noCallThru(),
	dbConStub = {},
	configStub = {},
	utilsStub = {},
	mapConfigStub = {
		sortingOptions: {
			title_asc: {
				column: 'map.title',
				direction: 'asc'
			},
			updated_on_desc: {
				column: 'map.updated_on',
				direction: 'desc'
			},
			created_on: {
				column: 'map.created_on',
				direction: 'desc'
			}
		}
	},
	mapCrudUtils = proxyquire('../api/v1/map.utils', {
		'./../../lib/db_connector': dbConStub,
		'./../../lib/config': configStub,
		'./../../lib/utils': utilsStub,
		'./map.config': mapConfigStub
	});

describe('map.utils.js', function () {
	it('buildSort() returns existing sorting option object', function () {
		expect(mapCrudUtils.buildSort('title_asc')).toEqual({
			column: 'map.title',
			direction: 'asc'
		});
	});

	it('buildSort() fall-backs to default sorting option', function () {
		expect(mapCrudUtils.buildSort('no_existing_option')).toEqual({
			column: 'map.created_on',
			direction: 'desc'
		});
	});

	it('buildSort() no default sorting option', function () {
		mapCrudUtils = proxyquire('../api/v1/map.utils', {
			'./../../lib/db_connector': dbConStub,
			'./../../lib/config': configStub,
			'./../../lib/utils': utilsStub,
			'./map.config': {}
		});
		expect(function () {
			mapCrudUtils.buildSort('no_existing_option');
		}).toThrow('Cannot read property \'no_existing_option\' of undefined');
	});
});
