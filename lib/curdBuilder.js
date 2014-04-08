'use strict';

var dbCon = require('./db_connector'),
	reqBodyParser = require('./requestBodyParser'),
	validateCurdConfig = require('./validateCurdConfig'),
	jsonValidator = require('./jsonValidator'),
	responseDataDecorator = require('./api_res_decor'),
	logger = require('./logger');

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

	Object.keys(blockedMethods).forEach(function (method) {
		Object.keys(curd).forEach(function (value) {
			if (curd[value].hasOwnProperty(method)) {
				curd[value][method] = false;
			}
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

	if (object.hasOwnProperty('id') && id) {
		object.id = id;
	}

	return object;
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

/**
 * Handler for sql errors
 * @param err {object} - error object
 * @param req {object} - http request object
 * @returns {object} - user facing error object
 */
function sqlErrorHandler(err, req) {
	logger.debug(err, logger.getContext(500, req));

	if (typeof err !== 'object' || !err.hasOwnProperty('clientError')) {
		return {
			code: 500,
			message: 'Unexpected error'
		};
	}
	if (err.clientError.name === 'RejectionError') {
		return {
			code: 500,
			message: 'Cannot make reference to non-existing value'
		};
	}
	return{
		code: 500,
		message: 'General database error'
	};
}


//Public
/**
 * @desc Creates CURD collection based on configuration object passed as parameter
 * @param config {object} - curd collection configuration
 * @param curdUrlPath {string} - url path for CURD
 * @returns {object} - CURD collection
 */

function createCURD(config, curdUrlPath) {

	validateCurdConfig(config);

	// set local variables
	var dbTable = config.dbTable,
		dbColumns = config.dbColumns,
		responseSchema = config.responseSchema || {},
		customResObjects = config.customResObjects || {},
		createSchema = config.createSchema || false,
		updateSchema = config.updateSchema || false,

		// create curd collection
		curd = {
			handler: {
				GET: function (req, res, next) {
					var queryMethod = setQueryMethod(dbCon, config, 'list'),
						query = queryMethod(dbTable, dbColumns);

					query.then(
						function (collection) {
							collection = responseDataDecorator(collection, responseSchema, createEntryPointUrl(
								req, curdUrlPath));

							res.send(200, collection);
							res.end();
						},
						function (err) {
							next(sqlErrorHandler(err, req));
						}
					);
				},
				POST: function (req, res, next) {
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

								res.send(201, data);
								res.end();
							},
							function (err) {
								next(sqlErrorHandler(err, req));
							}
						);
					} else {
						next({
							status: 400,
							message: {
								message: 'Bad request',
								details: errors
							}
						});
					}
				}
			},
			wildcard: {
				DELETE: function (req, res, next) {
					var id = parseInt(req.pathVar.id),
						queryMethod = setQueryMethod(dbCon, config, 'destroy'),
						filter = {
							id: id
						},
						query = queryMethod(dbTable, filter);

					query.then(
						function () {
							res.send(204, {});
							res.end();
						},
						function (err) {
							next(sqlErrorHandler(err, req));
						}
					);
				},
				GET: function (req, res, next) {
					var queryMethod = setQueryMethod(dbCon, config, 'fetch'),
						id = parseInt(req.pathVar.id),
						filter = {
							id: id
						},
						query = queryMethod(dbTable, dbColumns, filter);

					if (isFinite(id)) {
						query.then(
							function (collection) {
								var object = responseDataDecorator(collection, responseSchema, createEntryPointUrl(
									req, curdUrlPath))[0];

								if (object) {
									res.send(200, object);
									res.end();
								} else {
									next({
										status: 404,
										message: {
											message: 'Object not found',
											id: parseInt(id)
										}
									});
								}
							},
							function (err) {
								next(sqlErrorHandler(err, req));
							}
						);
					} else {
						next({
							status: 400,
							message: {
								message: 'Bad request',
								details: 'id: ' + req.pathVar.id + ' should be a number'
							}
						});
					}
				},
				PUT: function (req, res, next) {
					// get post request body and validate JSON
					var reqBody = reqBodyParser(req.rawBody),
						errors = jsonValidator(reqBody, updateSchema);

					if (errors.length === 0) {
						var queryMethod = setQueryMethod(dbCon, config, 'update'),
							id = parseInt(req.pathVar.id),
							filter = {
								id: id
							},
							query = queryMethod(dbTable, reqBody, filter);

						query.then(
							function () {
								// create response data
								var data = createResponseData(customResObjects.update, id);
								data = responseDataDecorator(data, responseSchema, createEntryPointUrl(
									req, curdUrlPath))[0];

								res.send(303, data);
								res.end();
							},
							function (err) {
								next(sqlErrorHandler(err, req));
							}
						);
					} else {
						next({
							status: 400,
							message: errors
						});
					}
				}
			}
		};

	// block methods
	blockCURDMethods(curd, config);

	return curd;
}

module.exports = createCURD;
