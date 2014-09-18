'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	jsonValidator = require('./../../lib/jsonValidator'),
	utils = require('./../../lib/utils'),
	errorHandler = require('./../../lib/errorHandler'),
	config = require('./../../lib/config'),

	// custom action for POST method
	addTileSet = require('./../../lib/addTileSet'),

	urlPattern = jsonValidator.getUrlPattern(),

	dbTable = 'tile_set',
	createSchema = {
		description: 'Schema for creating tile set',
		type: 'Object',
		properties: {
			name: {
				description: 'Tile set name',
				type: 'string',
				required: true,
				minLength: 1,
				maxLength: 255
			},
			url: {
				description: 'URL to image from which tiles wil be created',
				type: 'string',
				pattern: urlPattern,
				required: true,
				maxLength: 255
			},
			created_by: {
				description: 'Creator user name',
				type: 'string',
				required: true,
				minLength: 1,
				maxLength: 255
			}
		},
		additionalProperties: false
	},
	searchLimit = 50,
	minSearchCharacters = 2;

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
	tileSet.url = createTileSetAPIUrl(tileSet.id, req);
}

/**
 * @desc processes collection of tileSets
 * @param {Array} collection - collection of tileSets
 * @param {Object} req - HTTP request object
 * @param {Function} processFun - function for processing each element form the collection
 * @returns {Array}
 */
function processTileSetCollection(collection, req, processFun) {
	var length = collection.length,
		i;

	for (i = 0; i < length; i++) {
		processFun(collection[i], req);
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
	return search.length >= minSearchCharacters;
}

/**
 * @desc CRUD function for getting collection of tileSets
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Function} next
 */
function getTileSets(req, res, next) {
	var dbConnType = dbCon.connType.all,
		dbColumns = [
			'tile_set.id',
			'tile_set.name',
			'tile_set.type',
			'tile_set.status',
			'tile_set.width',
			'tile_set.height',
			'tile_set.image'
		],
		filter = {
			status: utils.tileSetStatus.ok
		},
		limit = parseInt(req.query.limit, 10) || false,
		offset = parseInt(req.query.offset, 10) || 0,
		search = req.query.search.trim() || false,
		query = dbCon.knex(dbTable).column(dbColumns).where(filter);

	// add search term to DB query
	if (search) {
		if (!validateSearchTerm(search)) {
			next(errorHandler.badRequestError([
				'Search string should be at least ' + minSearchCharacters + ' long.'
			]));
		}

		limit = limit ? Math.min(searchLimit, limit) : searchLimit;
		// TODO: do we need it?
		//offset = 0;

		addSearchToQuery(query, search);
	}

	// add pagination to DB query
	if (limit) {
		addPaginationToQuery(query, limit, offset);
	}

	// make a DB query
	dbCon.getConnection(dbConnType, function (conn) {
		query
			.connection(conn)
			.select()
			.then(function (collection) {
				res
					.status(200)
					.send(processTileSetCollection(collection, req, extendTileSetObject))
					.end();
			}, next);
	}, next);
}

/**
 * @desc Creates CRUD collection based on configuration object passed as parameter
 * @returns {object} - CRUD collection
 */

module.exports = function createCRUD() {
	return {
		handler: {
			GET: getTileSets,
			POST: function (req, res, next) {
				var reqBody = reqBodyParser(req.rawBody),
					errors = jsonValidator.validateJSON(reqBody, createSchema);

				if (errors.length === 0) {
					dbCon.getConnection(dbCon.connType.master, function (conn) {
						addTileSet(conn, dbTable, reqBody)
							.then(
							function (data) {
								var id = data.id,
									responseCode = 201,
									response = {
										message: 'Tile set added to processing queue',
										id: id,
										url: utils.responseUrl(req, utils.addTrailingSlash(req.route.path), id)
									};
								if (data.exists) {
									response.message = 'This tile set already exists';
									responseCode = 200;
								}
								res.send(responseCode, response);
								res.end();
							},
							next
						);
					}, next);
				} else {
					next(errorHandler.badRequestError(errors));
				}
			}
		},
		wildcard: {
			GET: function (req, res, next) {
				var dbColumns = [
						'name',
						'type',
						'image',
						'width',
						'height',
						'min_zoom',
						'max_zoom',
						'status',
						'created_by',
						'created_on',
						'attribution',
						'subdomains'
					],
					id = parseInt(req.pathVar.id),
					filter = {
						id: id,
						status: utils.tileSetStatus.ok
					};

				if (isFinite(id)) {
					dbCon.getConnection(dbCon.connType.all, function (conn) {
						dbCon
							.select(conn, dbTable, dbColumns, filter)
							.then(
								function (collection) {
									var obj = collection[0];

									if (obj) {
										// TODO: fix hardcoded DFS host
										obj.image = utils.imageUrl(
											config.dfsHost,
											utils.getBucketName(
												config.bucketPrefix + config.tileSetPrefix,
												id
											),
											obj.image
										);
										obj.max_zoom = utils.binToMaxZoomLevel(obj.max_zoom);
										res.send(200, obj);
										res.end();
									} else {
										next(errorHandler.elementNotFoundError(dbTable, id));
									}
								},
								next
						);
					}, next);
				} else {
					next(errorHandler.badNumberError(req.pathVar.id));
				}
			}
		}
	};
};
