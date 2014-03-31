'use strict';

var	dbCon = require('./db_connector'),
	reqBodyParser = require('./requestBodyParser'),
	validateCurdConfig = require('./validateCurdConfig' ),
	jsonValidator = require('./jsonValidator' ),
	responseDataDecorator = require('./api_res_decor');

/**
 * @desc Creates CURD collection based on configuration object passed as parameter
 * @param config {object} - curd collection configuration
 * @param apiEntryPointUrl {string} - url for API entry point
 * @returns {object} - CURD collection
 */

function createCURD(config, apiEntryPointUrl) {

	validateCurdConfig(config);

	// set local variables
	var	dbTable = config.dbTable,
		dbColumns = config.dbColumns,
		responseSchema = config.responseSchema || {},
		createSchema = config.createSchema || false,
		updateSchema = config.updateSchema || false,

		// create curd collection
		curd = {
			handler: {
				GET: function(req, res) {
					var queryMethod = setQueryMethod(dbCon, config, 'list'),
						query = queryMethod(dbTable, dbColumns);

					query.then(
						function (collection) {
							collection = responseDataDecorator(collection, responseSchema, apiEntryPointUrl);
							sendResponse(res, 200, collection);
						},
						function (err) {
							sendResponse(res, 500, err);
						}
					);
				},
				POST: function(req, res) {
					// get post request body and validate JSON
					var reqBody = reqBodyParser(req.rawBody),
						errors = jsonValidator(reqBody, createSchema);

					if (errors.length === 0) {
						var queryMethod = setQueryMethod(dbCon, config, 'insert'),
							query = queryMethod(dbTable, reqBody);

						query.then(
							function (data) {
								// overwrite db response to the client
								data = createResponseData(config, 'create', data);
								data = responseDataDecorator(data, responseSchema, apiEntryPointUrl)[0];

								sendResponse(res, 201, data);
							},
							function (err) {
								sendResponse(res, 500, err);
							}
						);
					} else {
						sendResponse(res, 400, errors);
					}
				}
			},
			wildcard: {
				DELETE: function(req, res) {
					var id = parseInt(req.pathVar.id),
						queryMethod = setQueryMethod(dbCon, config, 'destroy'),
						filter = {id: id},
						query = queryMethod(dbTable, filter);

					query.then(
						function () {
							sendResponse(res, 204, {});
						},
						function (err) {
							sendResponse(res, 500, err);
						}
					);
				},
				GET: function(req, res) {
					var queryMethod = setQueryMethod(dbCon, config, 'fetch'),
						id = parseInt(req.pathVar.id),
						filter = {id: id},
						query = queryMethod(dbTable, dbColumns, filter);

					query.then(
						function (collection) {
							var object = responseDataDecorator(collection, responseSchema, apiEntryPointUrl)[0];

							if (object) {
								sendResponse(res, 200, object);
							} else {
								sendResponse(res, 404, {
									status: 404,
									message: 'Object not found!',
									id: parseInt(id)
								});
							}
						},
						function (err) {
							sendResponse(res, 500, err);
						}
					);
				},
				PUT: function(req, res) {
					// get post request body and validate JSON
					var reqBody = reqBodyParser(req.rawBody),
						errors = jsonValidator(reqBody, updateSchema );

					if (errors.length === 0) {
						var queryMethod = setQueryMethod(dbCon, config, 'update'),
							id = parseInt(req.pathVar.id),
							filter = {id: id},
							query = queryMethod(dbTable, reqBody, filter);

						query.then(
							function () {
								// create response data
								var data = createResponseData(config, 'update', id);
								data = responseDataDecorator(data, responseSchema, apiEntryPointUrl);

								sendResponse(res, 303, data);
							},
							function (err) {
								sendResponse(res, 500, err);
							}
						);
					} else {
						sendResponse(res, 400, errors);
					}
				}
			}
		};

	// block methods
	blockCURDMethods(curd, config);

	return curd;
}

// Private functions

/**
 * @desc Set query method (default db connector method or custom set in curd configuration)
 * @param dbCon {object} - db connector
 * @param config {object} - curd collection configuration
 * @param type {string} - curd collection method
 * @returns {function} - function for doing a query
 */

function setQueryMethod(dbCon, config, type) {
	var customMethods = config.customMethods || {},
		customMethod = customMethods[type],
		dbConMethod = (type === 'fetch' || type === 'list') ? 'select' : type;

	return (customMethod) ? customMethod : dbCon[dbConMethod];
}

/**
 * @desc Blocks CURD collection methods
 * @param curd {object} - curd Collection
 * @param config {object} - curd configuration object
 */

function blockCURDMethods(curd, config) {
	var blockedMethods = config.blockedMethods || {},
		wildcard = curd.wildcard,
		handler = curd.handler,
		p;

	for (p in blockedMethods.wildcard) {
		if (wildcard.hasOwnProperty(p)) {
			wildcard[p] = false;
		}
	}
	for (p in blockedMethods.handler) {
		if (handler.hasOwnProperty(p)) {
			handler[p] = false;
		}
	}
}

/**
 * @desc creates response data
 * @param config {object} - curd configuration object
 * @param type {string} - type of curd method
 * @param id {number} - id of the object
 * @returns {object} - custom response data
 */

function createResponseData(config, type, id) {
	var object = config.customResObjects[type];

	if (object.hasOwnProperty('id') && id) {
		object.id = id;
	}

	return object;
}

/**
 * @desc Sends response to to client
 * @param res {object} - http response object
 * @param code {number} - http status code
 * @param data {object} - data object send to client
 */

function sendResponse(res, code, data) {
	data = JSON.stringify(data);

	res.statusCode = code;
	res.setHeader('Content-Type', 'application/json');
	res.end(data);
}

module.exports = createCURD;
