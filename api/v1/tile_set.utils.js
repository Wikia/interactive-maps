'use strict';

var utils = require('./../../lib/utils'),
	config = require('./../../lib/config'),
	tileSetConfig = require('./tile_set.config');

/**
 * @desc creates tileSet image URL and returns it
 * @param {Number} tileSetId
 * @param {String} imageName
 * @returns {String} - tileSet image URL
 */
function createTileSetImageUrl(tileSetId, imageName) {
	return utils.imageUrl(
		config.dfsHost,
		utils.getBucketName(
			config.bucketPrefix + config.tileSetPrefix,
			tileSetId
		),
		imageName
	);
}

/**
 * @desc creates API URL for tileSetObject and returns it
 * @param {Number} tileSetId
 * @param {Object} req - HTTP request object
 * @returns {String} - tileSet Object API URL
 */
function createTileSetAPIUrl(tileSetId, req) {
	return utils.responseUrl(req, utils.addTrailingSlash(req.route.path), tileSetId);
}

/**
 * @desc extends params of tileSet object
 * @param {Object} tileSet
 * @param {Object} req - HTTP request object
 */
function extendTileSetObject(tileSet, req) {
	tileSet.image = createTileSetImageUrl(tileSet.id, tileSet.image);
	tileSet.max_zoom = utils.binToMaxZoomLevel(tileSet.max_zoom);
	tileSet.url = createTileSetAPIUrl(tileSet.id, req);
}

/**
 * @desc processes collection of tileSets
 * @param {Array} collection - collection of tileSets
 * @param {Object} req - HTTP request object
 * @param {Function} process - function for processing each element form the collection
 * @returns {Array}
 */
function processTileSetCollection(collection, req, process) {
	var length = collection.length,
		i;

	for (i = 0; i < length; i++) {
		process(collection[i], req);
	}

	return collection;
}

/**
 * @desc adds pagination to DB query
 * @param {Object} query - Knex DB query object
 * @param {Number} limit - number of results
 * @param {Number} offset - offset from top
 */
function addPaginationToQuery(query, limit, offset) {
	query
		.limit(limit)
		.offset(offset);
}

/**
 * @desc adds search term to query
 * @param {Object} query - Knex DB query object
 * @param {String} search - search term
 */
function addSearchToQuery(query, search) {
	query
		.join('tile_set_search', 'tile_set.id', '=', 'tile_set_search.id')
		.whereRaw('MATCH (tile_set_search.name) AGAINST (?)', [search])
		.orderBy('created_on', 'desc');
}

/**
 * @desc validates search term
 * @param {String} search - search term
 * @returns {Boolean}
 */
function validateSearchTerm(search) {
	return search.length >= tileSetConfig.minSearchCharacters;
}

/**
 * @desc sets pagination limit for search query
 * @param {Number} limit
 * @returns {number}
 */
function setupSearchLimit(limit) {
	return limit ? Math.min(tileSetConfig.searchLimit, limit) : tileSetConfig.searchLimit;
}

/**
 * @desc creates response object for create tileSet
 * @param {Object} dbRes - DB response object
 * @param {Object} req - HTTP request object
 * @returns {Object} - JSON object with response
 */
function setupCreateTileSetResponse(dbRes, req) {
	var id = dbRes.id,
		message = dbRes.exist ?
			'This tile set already exists' :
			'Tile set added to processing queue';

	return {
		message: message,
		id: id,
		url: createTileSetAPIUrl(id, req)
	};
}

module.exports = {
	addSearchToQuery: addSearchToQuery,
	validateSearchTerm: validateSearchTerm,
	setupSearchLimit: setupSearchLimit,
	addPaginationToQuery: addPaginationToQuery,
	processTileSetCollection: processTileSetCollection,
	extendTileSetObject: extendTileSetObject,
	setupCreateTileSetResponse: setupCreateTileSetResponse
};
