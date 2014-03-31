/**
 *	This module is responsible ofr creating CURD collections for Percolator.js
 *	It has a factory method 'createCollection' which returns new CURDCollection based on schema passed as an argument
 */

'use strict';

var dbCon = require('./db_connector'),
	decorator = require('./api_res_decor'),
	CURDCollection = require('percolator').CRUDCollection,

	// TODO: temporary should be moved to other place so it together with API version
	apiEntryPoint = 'http://localhost:3000/api/v1';

/**
 * @desc Creates CURD collection based on configuration object passed as parameter
 * @param config {object} - curd collection configuration
 * @returns {object} - CURD collection
 */

function createCollection(config) {

	validateConfig(config);
	validateSchemas(config);

	// local variables
	var dbTable = config.dbTable,
		dbColumns = config.dbColumns,
		responseSchema = config.responseSchema || false,

		// create new CURD Collection
		curd = new CURDCollection({

			/**
			 * @desc handler for POST request for creating object
			 * @param req {object} - http request object
			 * @param res {object} - http response object
			 * @param obj {object} - JSON object with data
			 */

			create: function (req, res, obj) {
				var queryMethod = setQueryMethod(dbCon, config, 'insert'),
					query = queryMethod(dbTable, obj);

				query.then(
					function (result) {
						var data = createCustomResponseData(config, 'create', result);

						sendCustomResponse(res, 201, data);
					},
					function (err) {
						res.status.internalServerError(err);
					}
				).done();
			},

			/**
			 * @desc handler for DELETE request for deleting object
			 * @param req {object} - http request object
			 * @param res {object} - http response object
			 * @param id {string} - object id
			 * @param cb {function(error, result)} - response callback function
			 */

			destroy: function (req, res, id, cb) {
				var queryMethod = setQueryMethod(dbCon, config, 'destroy'),
					filter = {id: id},
					query = queryMethod(dbTable, filter);

				query.then(
					function () {
						cb();
					},
					function (err) {
						res.status.internalServerError(err);
					}
				);
			},

			/**
			 * @desc handler for GET request for getting single object
			 * @param req {object} - http request object
			 * @param res {object} - http response object
			 * @param cb {function(error, result)} - response callback function
			 */

			fetch: function (req, res, cb) {
				var queryMethod = setQueryMethod(dbCon, config, 'fetch'),
					filter = {id: req.uri.child()},
					query = queryMethod(dbTable, dbColumns, filter);

				query.then(
					function (collection) {
						var object;

						object = decorator(collection, responseSchema, apiEntryPoint)[0];

						// if no rows found, send 404
						(object) ? cb(null, object) : cb(true);
					},
					function (err) {
						res.status.internalServerError(err);
					}
				);
			},

			/**
			 * @desc handler for GET request for getting list of objects
			 * @param req {object} - http request object
			 * @param res {object} - http response object
			 * @param cb {function(error, result)} - response callback function
			 */

			list: function (req, res, cb) {
				var queryMethod = setQueryMethod(dbCon, config, 'list'),
					query = queryMethod(dbTable, dbColumns);

				query.then(
					function (collection) {
						collection = decorator(collection, responseSchema, apiEntryPoint);

						cb(null, collection);
					},
					function (err) {
						res.status.internalServerError(err);
					}
				);
			},

			/**
			 * @desc handler for PUT request for update single object
			 * @param req {object} - http request object
			 * @param res {object} - http response object
			 * @param id {string} - object id
			 * @param obj {object} - JSON object with data
			 * @param cb {function(error, result)} - response callback function
			 */

			update: function (req, res, id, obj) {
				var queryMethod = setQueryMethod(dbCon, config, 'update' ),
					filter = {id: id},
					query = queryMethod(dbTable, obj, filter);

				query.then(
					function () {
						var data = createCustomResponseData(config, 'update', id);

						sendCustomResponse(res, 303, data);
					},
					function (err) {
						res.status.internalServerError(err);
					}
				);
			}
		});

	// set configs
	setSchemas(curd, config);

	// block methods
	blockCURDMethods(curd, config);

	return curd;
}

// Private functions


/**
 * @desc Validates config type and required params
 * @param config {object} - config for API entry point
 */

function validateConfig(config) {
	// validate type of config
	if (typeof config !== 'object') {
		throw new Error('Config must be an object!');
	}

	// check if required config properties exist
	if (!config.hasOwnProperty('dbTable') || !config.hasOwnProperty('dbColumns')) {
		throw new Error('Config properties "dbTable" and "dbColumns" are required!');
	}
}

/**
 * @desc Validates create and update schema
 * @param config {object} - CURD configuration object
 */

function validateSchemas(config) {
	var blockedMethods = config.blockedMethods || {};

	if (blockedMethods.POST !== false && !config.createSchema) {
		throw new Error('Schema for validating object creation is required!');
	}
	if (blockedMethods.PUT !== false && !config.updateSchema) {
		throw new Error('Schema for validating object updating is required!');
	}
}

/**
 * @desc set configs for object creation and updating
 * @param curd {object} - curd Collection
 * @param config {object} - curd configuration object
 */

function setSchemas(curd, config) {
	var createSchema = config.createSchema || false,
		updateSchema = config.updateSchema || false;

	if (createSchema) {
		curd.createSchema = createSchema;
	}
	if (updateSchema) {
		curd.updateSchema = updateSchema;
	}
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

	for (p in blockedMethods) {
		if (wildcard.hasOwnProperty(p)) {
			wildcard[p] = false;
		}
		if (handler.hasOwnProperty(p)) {
			handler[p] = false;
		}
	}
}

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
		type = (type === 'fetch' || type === 'list') ? 'select' : type;

	return (customMethod) ? customMethod : dbCon[type];
}

/**
 * @desc creates custom response data
 * @param type {string} - type of curd method
 * @param id {number} - id of the object
 * @returns {object} - custom response data
 */

function createCustomResponseData(config, type, id) {
	var object = config.customResObjects[type];

	if (object.hasOwnProperty('id') && id) {
		object.id = id;
	}

	return decorator(object, config.responseSchema, apiEntryPoint)[0];
}

/**
 * @desc Sends custom response to to client (use instead of cb() function)
 * @param res {object} - http response object
 * @param code {number} - http status code
 * @param data {object} - data object send to client
 */

function sendCustomResponse(res, code, data) {
	data = JSON.stringify(data);

	res.statusCode = code;
	res.setHeader('Content-Type', 'application/json');
	res.end(data);
}

// Public API

module.exports = {
	createCollection: createCollection
}
