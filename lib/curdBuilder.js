'use strict';

var	dbCon = require('./db_connector'),
	reqBodyParser = require('./requestBodyParser'),
	validateCurdConfig = require('./validateCurdConfig'),
	jsonValidator = require('./jsonValidator'),
	responseDataDecorator = require('./api_res_decor');

/**
 * @desc Creates CURD collection based on configuration object passed as parameter
 * @param config {object} - curd collection configuration
 * @param curdUrlPath {string} - url path for CURD
 * @returns {object} - CURD collection
 */

function createCURD(config, curdUrlPath) {

	validateCurdConfig(config);

	// set local variables
	var	dbTable = config.dbTable,
		dbColumns = config.dbColumns,
		responseSchema = config.responseSchema || {},
		customResObjects = config.customResObjects || {},
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
							collection = responseDataDecorator(collection, responseSchema, createEntryPointUrl(
								req, curdUrlPath));
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
								data = createResponseData(customResObjects.create, data);
								data = responseDataDecorator(data, responseSchema, createEntryPointUrl(
									req, curdUrlPath))[0];

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
							var object = responseDataDecorator(collection, responseSchema, createEntryPointUrl(
								req, curdUrlPath))[0];

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
								var data = createResponseData(customResObjects.update, id);
								data = responseDataDecorator(data, responseSchema, createEntryPointUrl(
									req, curdUrlPath))[0];

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
	var blockedMethods = config.blockedMethods || {};

	Object.keys(curd).forEach(function(value) {
		Object.keys(blockedMethods).forEach(function(handler) {
			Object.keys(blockedMethods[handler]).forEach(function(method) {
				if (curd[value].hasOwnProperty(method)) {
					curd[value][method] = false;
				}
			});
		});
	});
}

/**
 * @desc creates response data
 * @param resData {object} - response data object
 * @param id {number} - id of the object
 * @returns {object} - custom response data
 */

function createResponseData(resData, id) {
	var object = (!resData) ? {} : resData;

	if (id) {
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
	if (data) {
		data = JSON.stringify(data);
	}

	res.statusCode = code;
	res.setHeader('Content-Type', 'application/json');
	res.end(data);
}

/**
 * @desc builds entry point url for CURD
 * @param req {object} -  http request object
 * @param curdUrlPath - CURD entry point path
 * @returns {string}
 */

function createEntryPointUrl(req, curdUrlPath) {
	return req.protocol + '://' + req.headers.host + curdUrlPath;
}

module.exports = createCURD;
