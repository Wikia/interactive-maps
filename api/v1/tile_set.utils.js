'use strict';

var Q = require('q'),
	utils = require('./../../lib/utils'),
	config = require('./../../lib/config'),
	errorHandler = require('./../../lib/errorHandler'),
	tileSetConfig = require('./tile_set.config');

/**
 * @desc extends params of tileSet object
 * @param {Object} tileSet
 * @param {Object} req - HTTP request object
 */
function extendTileSetObject(tileSet, req) {
	var tileSetId = tileSet.id;

	tileSet.image = utils.imageUrl(
		config.dfsHost,
		utils.getBucketName(
			config.bucketPrefix + config.tileSetPrefix,
			tileSetId
		),
		tileSet.image
	);

	tileSet.url = utils.responseUrl(req, req.route.path, tileSetId);

	if (tileSet.max_zoom) {
		tileSet.max_zoom = utils.binToMaxZoomLevel(tileSet.max_zoom);
	}

	return tileSet;
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
		collection[i] = process(collection[i], req);
	}

	return collection;
}

/**
 * @desc adds search term to query
 * @param {Object} query - Knex DB query object
 * @param {String} search - search term
 */
function addSearchToQuery(query, search) {
	// MWEB-700 after discussion with OPS it's safe here to use LIKE until tile_set table gets 50k-200k rows
	query
		.where('tile_set.name', 'like', '%' + search + '%')
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
 * @param {Number=} limit
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
		message = dbRes.exists ? tileSetConfig.responseMessages.canceled : tileSetConfig.responseMessages.created;

	return {
		message: message,
		id: id,
		url: utils.responseUrl(req, utils.addTrailingSlash(req.route.path), id)
	};
}

/**
 * @desc Changes query and its options if valid search parameter was passed
 * @param {Object} query knex query object's instance
 * @param {String|Boolean} search value of search parameter
 * @param {Number} limit results limit
 * @returns {Object} a simple object with new query and new limit
 */
function changeOptionsIfSearchIsValid(query, search, limit) {
	var deferred = Q.defer();

	// add search term to DB query
	if (search) {
		search = search.trim();

		if (!validateSearchTerm(search)) {
			throw errorHandler.badRequestError([tileSetConfig.searchErrorMsg]);
		}

		limit = setupSearchLimit(limit);
		addSearchToQuery(query, search);
	}

	deferred.resolve({
		query: query,
		limit: limit
	});

	return deferred.promise;
}

module.exports = {
	addSearchToQuery: addSearchToQuery,
	validateSearchTerm: validateSearchTerm,
	setupSearchLimit: setupSearchLimit,
	processTileSetCollection: processTileSetCollection,
	extendTileSetObject: extendTileSetObject,
	setupCreateTileSetResponse: setupCreateTileSetResponse,
	changeOptionsIfSearchIsValid: changeOptionsIfSearchIsValid
};
