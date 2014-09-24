'use strict';

var config = require('./../../lib/config'),
	utils = require('./../../lib/utils'),
	mapConfig = require('./map.config');

/**
 * @desc Builds object which is later used in knex.orderBy()
 *       Default value is { column: 'created_on', direction: 'desc' }
 * @param {String} sort description of sorting passed as GET parameter i.e. title_asc
 * @returns {object}
 */
function buildSort(sort) {
	if (mapConfig.sortingOptions.hasOwnProperty(sort)) {
		return mapConfig.sortingOptions[sort];
	}

	// default sorting type
	return mapConfig.sortingOptions.created_on;
}

/**
 * @desc Builds maps collection list
 * @param {array} collection List of maps
 * @param {object} req Express request object
 * @returns {array}
 */
function buildMapCollectionResult(collection, req) {
	collection.forEach(function (value) {
		value.image = utils.imageUrl(
			config.dfsHost,
			utils.getBucketName(
				config.bucketPrefix + config.tileSetPrefix,
				value.tile_set_id
			),
			value.image
		);
		value.url = utils.responseUrl(
			req,
			utils.addTrailingSlash(req.route.path),
			value.id
		);

		delete value.tile_set_id;
	});
	return collection;
}

module.exports = {
	buildSort: buildSort,
	buildMapCollectionResult: buildMapCollectionResult
};
