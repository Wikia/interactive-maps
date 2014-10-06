'use strict';

var proxyquire = require('proxyquire').noCallThru(),
	whereStub = {
		city_id: 123
	},
	whereInStub = [
		'tile-set-processed',
		'tile-set-approved'
	],
	orderByStub = {
		column: 'title',
		direction: 'desc'
	},
	dbConStub = {},
	configStub = {},
	utilsStub = {
		getBucketName: function () {},
		addTrailingSlash: function () {},
		imageUrl: function () {
			return 'mocked image URL';
		},
		responseUrl: function () {
			return 'mocked response URL';
		}
	},
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
	};

function getMapCrudUtilsMock(mapConfigStub, dbConStub) {
	return proxyquire('../api/v1/map.utils', {
		'./../../lib/db_connector': dbConStub,
		'./../../lib/config': configStub,
		'./../../lib/utils': utilsStub,
		'./map.config': mapConfigStub
	});
}

function getDbConMock() {
	return {
		knex: function () {
			return {
				column: function () {
					return this;
				},
				join: function () {
					return this;
				},
				connection: function () {
					return this;
				},
				where: function (whereOpts) {
					expect(whereOpts).toEqual(whereStub);
					return this;
				},
				whereIn: function (field, whereInOpts) {
					expect(field).toEqual('tile_set.status');
					expect(whereInOpts).toEqual(whereInStub);
					return this;
				},
				orderBy: function (field, value) {
					expect(field).toEqual(orderByStub.column);
					expect(value).toEqual(orderByStub.direction);
					return this;
				}
			};
		}
	};
}

describe('map.utils.js', function () {
	it('buildSort() returns existing sorting option object', function () {
		var mapCrudUtils = getMapCrudUtilsMock(mapConfigStub, dbConStub);
		expect(mapCrudUtils.buildSort('title_asc')).toEqual({
			column: 'map.title',
			direction: 'asc'
		});
	});

	it('buildSort() fall-backs to default sorting option', function () {
		var mapCrudUtils = getMapCrudUtilsMock(mapConfigStub, dbConStub);
		expect(mapCrudUtils.buildSort('no_existing_option')).toEqual({
			column: 'map.created_on',
			direction: 'desc'
		});
	});

	it('buildSort() no default sorting option', function () {
		var mapCrudUtils = getMapCrudUtilsMock({}, dbConStub);
		expect(function () {
			mapCrudUtils.buildSort('no_existing_option');
		}).toThrow('Cannot read property \'no_existing_option\' of undefined');
	});

	it('buildMapCollectionResult() works as expected', function () {
		var mapCrudUtils = getMapCrudUtilsMock(mapConfigStub, dbConStub),
			requestStub = {
				route: {
					path: ''
				}
			},
			collectionStub = [{
				'title': 'Map 1'
				// don't pass tile_set_id for purpose
			}, {
				'title': 'Map 2',
				'tile_set_id': 1
			}, {
				'title': 'Map 3',
				'tile_set_id': 1
			}],
			expectedCollection = [{
				'title': 'Map 1',
				'image': 'mocked image URL',
				'url': 'mocked response URL'
			}, {
				'title': 'Map 2',
				'image': 'mocked image URL',
				'url': 'mocked response URL'
			}, {
				'title': 'Map 3',
				'image': 'mocked image URL',
				'url': 'mocked response URL'
			}];

		expect(mapCrudUtils.buildMapCollectionResult(collectionStub, requestStub)).toEqual(expectedCollection);
	});

	it('buildMapCollectionResult() throws an error when invalid value as collection passed', function () {
		var mapCrudUtils = getMapCrudUtilsMock(mapConfigStub, dbConStub),
			requestStub = {
				route: {
					path: ''
				}
			},
			testCases = [
				'collection',
				1,
				{
					field: 'a field'
				},
				true
			];

		testCases.forEach(function (collectionStub) {
			expect(function () {
				mapCrudUtils.buildMapCollectionResult(collectionStub, requestStub);
			}).toThrow();
		});
	});

	it('getMapsCountQuery()', function () {
		var dbConStub = getDbConMock(),
			mapCrudUtils = getMapCrudUtilsMock(mapConfigStub, dbConStub);

		mapCrudUtils.getMapsCountQuery({}, whereStub, whereInStub);
	});

	it('getMapsCollectionQuery', function () {
		var dbConStub = getDbConMock(),
			mapCrudUtils = getMapCrudUtilsMock(mapConfigStub, dbConStub);

		mapCrudUtils.getMapsCollectionQuery({}, whereStub, whereInStub, orderByStub);
	});
});
