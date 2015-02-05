'use strict';

var proxyquire = require('proxyquire').noCallThru(),
	tileSetConfig = proxyquire('../api/v1/tile_set.config', {
		'./../../lib/cachingUtils': {}
	}),
	deferMock = {
		resolve: jasmine.createSpy('resolve'),
		promise: {}
	},
	Q = {
		defer: jasmine.createSpy('defer').andReturn(deferMock)
	},
	utils = jasmine.createSpyObj(
		'utils',
		['imageUrl', 'responseUrl', 'addTrailingSlash', 'binToMaxZoomLevel', 'getBucketName']
	),
	config = {
		dfsHost: 'dfshost',
		bucketPrefix: 'int',
		tileSetPrefix: 'tileSet'

	},
	errorHandler = jasmine.createSpyObj('errorHandler', ['badRequestError']),
	tileSetUtils = proxyquire('../api/v1/tile_set.utils', {
		'q': Q,
		'./../../lib/utils': utils,
		'./../../lib/config': config,
		'./../../lib/errorHandler': errorHandler,
		'./tile_set.config': tileSetConfig
	});

/**
 * @desc returns mocks for extend tileSet Object tests
 * @returns {Object}
 */
function createMocks() {
	return {
		imageMock: 'test.png',
		bucketNameMock: 'testBucket',
		slashMock: '/',
		urlMock: 'test.url.com',
		maxZoomMock: 1,
		extendedMaxZoomMock: 2,
		reqMock: {
			route: {
				path: 'test/:id'
			}
		},
		dbResMock: {
			id: 1
		}
	};
}

/**
 * @desc setup spies for extend tileSet Object testsq
 */
function setupSpies(mocks) {
	utils.getBucketName.andReturn(mocks.bucketNameMock);
	utils.addTrailingSlash.andReturn(mocks.slashMock);
	utils.responseUrl.andReturn(mocks.urlMock);
	utils.binToMaxZoomLevel.andReturn(mocks.extendedMaxZoomMock);
}

function processTileSetHelper(tileSet) {
	return tileSet;
}

describe('TileSet Utils', function () {
	it('Is module with public API', function () {
		expect(typeof tileSetUtils === 'object').toBe(true);
		expect(typeof tileSetUtils.addSearchToQuery === 'function').toBe(true);
		expect(typeof tileSetUtils.validateSearchTerm === 'function').toBe(true);
		expect(typeof tileSetUtils.setupSearchLimit === 'function').toBe(true);
		expect(typeof tileSetUtils.processTileSetCollection === 'function').toBe(true);
		expect(typeof tileSetUtils.extendTileSetObject === 'function').toBe(true);
		expect(typeof tileSetUtils.setupCreateTileSetResponse === 'function').toBe(true);
		expect(typeof tileSetUtils.changeOptionsIfSearchIsValid === 'function').toBe(true);
	});

	it('extends simple tile set object', function () {
		var mocks = createMocks(),
			tileSet = {
				id: 1,
				image: mocks.imageMock
			};

		setupSpies(mocks);
		tileSet = tileSetUtils.extendTileSetObject(tileSet, mocks.reqMock);

		expect(utils.getBucketName).toHaveBeenCalledWith(config.bucketPrefix + config.tileSetPrefix, tileSet.id);
		expect(utils.imageUrl).toHaveBeenCalledWith(config.dfsHost, mocks.bucketNameMock, mocks.imageMock);
		expect(utils.responseUrl).toHaveBeenCalledWith(mocks.reqMock, mocks.reqMock.route.path, tileSet.id);
		expect(tileSet.url).toBe(mocks.urlMock);
		expect(tileSet.hasOwnProperty('max_zoom')).toBe(false);
	});

	it('extends tile set object with max zoom', function () {
		var mocks = createMocks(),
			tileSet = {
				id: 1,
				image: mocks.imageMock,
				max_zoom: mocks.maxZoomMock
			};

		setupSpies(mocks);
		tileSet = tileSetUtils.extendTileSetObject(tileSet, mocks.reqMock);

		expect(utils.getBucketName).toHaveBeenCalledWith(config.bucketPrefix + config.tileSetPrefix, tileSet.id);
		expect(utils.imageUrl).toHaveBeenCalledWith(config.dfsHost, mocks.bucketNameMock, mocks.imageMock);
		expect(utils.responseUrl).toHaveBeenCalledWith(mocks.reqMock, mocks.reqMock.route.path, tileSet.id);
		expect(tileSet.url).toBe(mocks.urlMock);
		expect(utils.binToMaxZoomLevel).toHaveBeenCalledWith(mocks.maxZoomMock);
		expect(tileSet.max_zoom).toBe(mocks.extendedMaxZoomMock);
	});

	it('processes tileSet Collection', function () {
		var collection = [1, 2, 3, 4, 5],
			reqMock = {},
			spies = {
				processTileSetHelper: processTileSetHelper
			},
			processedCollection;

		spies.processTileSetHelper = processTileSetHelper;
		spyOn(spies, 'processTileSetHelper').andCallThrough();

		processedCollection = tileSetUtils.processTileSetCollection(collection, reqMock, spies.processTileSetHelper);

		expect(processedCollection).toBe(collection);
		expect(spies.processTileSetHelper.calls.length).toEqual(collection.length);

		collection.forEach(function (value) {
			expect(spies.processTileSetHelper).toHaveBeenCalledWith(value, reqMock);
		});
	});

	//it('adds search to db query', function () {
	//
	//});

	it('validates search term', function () {
		var invalidSearchTerms = [
				'',
				'a'
			],
			validSearchTerms = [
				'aa',
				'aaa'
			];

		invalidSearchTerms.forEach(function (value) {
			expect(tileSetUtils.validateSearchTerm(value)).toBe(false);
		});
		validSearchTerms.forEach(function (value) {
			expect(tileSetUtils.validateSearchTerm(value)).toBe(true);
		});
	});

	it('sets default search limit', function () {
		expect(tileSetUtils.setupSearchLimit()).toBe(tileSetConfig.searchLimit);
	});

	it('sets custom search limit', function () {
		var limit = 30;

		expect(tileSetUtils.setupSearchLimit(limit)).toBe(limit);
	});

	it('sets default search limit if custom is bigger then default', function () {
		var limit = 60;

		expect(tileSetUtils.setupSearchLimit(limit)).toBe(tileSetConfig.searchLimit);
	});

	it('sets create tileSet response', function () {
		var mocks = createMocks(),
			response;

		setupSpies(mocks);
		response = tileSetUtils.setupCreateTileSetResponse(mocks.dbResMock, mocks.reqMock);

		expect(utils.responseUrl).toHaveBeenCalledWith(mocks.reqMock, mocks.reqMock.route.path, mocks.dbResMock.id);
		expect(response.message).toBe(tileSetConfig.responseMessages.created);
		expect(response.id).toBe(mocks.dbResMock.id);
		expect(response.url).toBe(mocks.urlMock);
	});

	it('sets create tileSet response if tileSet already exist', function () {
		var mocks = createMocks(),
			response;

		mocks.dbResMock.exists = true;

		setupSpies(mocks);
		response = tileSetUtils.setupCreateTileSetResponse(mocks.dbResMock, mocks.reqMock);

		delete mocks.dbResMock.exists;

		expect(utils.responseUrl).toHaveBeenCalledWith(mocks.reqMock, mocks.reqMock.route.path, mocks.dbResMock.id);
		expect(response.message).toBe(tileSetConfig.responseMessages.canceled);
		expect(response.id).toBe(mocks.dbResMock.id);
		expect(response.url).toBe(mocks.urlMock);
	});

	it('doesn\'t change query if no search term', function () {
		var query = {},
			search = false,
			limit = 1,
			promise;

		promise = tileSetUtils.changeOptionsIfSearchIsValid(query, search, limit);

		expect(Q.defer).toHaveBeenCalled();
		expect(deferMock.resolve).toHaveBeenCalledWith({
			query: query,
			limit: limit
		});
		expect(promise).toBe(deferMock.promise);
	});

	it('throws error if search term validation fail', function () {
		var query = {},
			search = 'a',
			limit = 1,
			errorMessage = 'test';

		errorHandler.badRequestError.andReturn(new Error(errorMessage));

		expect(function () {
			tileSetUtils.changeOptionsIfSearchIsValid(query, search, limit);
		}).toThrow(errorMessage);

		expect(errorHandler.badRequestError).toHaveBeenCalledWith([tileSetConfig.searchErrorMsg]);
	});

	it('adds search to query', function () {
		var queryMock = jasmine.createSpyObj('queryMock', ['where', 'orderBy']),
			search = 'test';

		queryMock.where.andReturn(queryMock);

		tileSetUtils.addSearchToQuery(queryMock, search);

		expect(queryMock.where).toHaveBeenCalledWith('tile_set.name', 'like', '%' + search + '%');
		expect(queryMock.orderBy).toHaveBeenCalledWith('created_on', 'desc');
	});
});
