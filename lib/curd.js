/**
 *	This module is responsible ofr creating CURD collections for Percolator.js
 *	It has a factory method 'createCollection' which returns new CURDCollection based on schema passed as an argument
 */

'use strict';

var dbCon = require( './db_connector' ),
	CURDCollection = require( 'percolator' ).CRUDCollection;

/**
 * @desc Creates CURD collection based on configuration object passed as parameter
 * @param config {object} - object with db schemas, JSON validation schemas and other configuration options for creating
 * 							CURD collection
 * @returns {object} - CURD collection
 */

function createCollection( config ) {

	// validate type of config
	if ( typeof config !== 'object' ) {
		throw new Error( 'Config should be an object!' );
	}

	// check if required config properties exist
	if ( !config.hasOwnProperty( 'dbTable' ) || !config.hasOwnProperty( 'dbColumns' ) ) {
		throw new Error( 'Confing properties "dbTable" and "dbColumns" are required!' );
	}
	
	// local variables
	var dbTable = config.dbTable,
		dbColumns = config.dbColumns,
		customMethods = ( config.hasOwnProperty( 'customMethods' ) ) ? config.customMethods : {},
		responseSchema = ( config.hasOwnProperty( 'responseSchema' ) ) ? config.responseSchema : false,
		createSchema = ( config.hasOwnProperty( 'createSchema' ) ) ? config.createSchema : false,
		updateSchema = ( config.hasOwnProperty( 'updateSchema' ) ) ? config.updateSchema : false,
		curd,

		/**
		 * @desc Assign a function to custom method if exist in config, set it to false if its disabled or leave undefined
		 * @param method {string} - method name
		 * @returns {function|bool|undefined}
		 */

			getCustomMethod = function( method ) {
			return ( customMethods.hasOwnProperty( method ) ) ? customMethods[method] : null;
		};

	// check if create schema exist if required
	if ( getCustomMethod( 'create' ) !== false && createSchema === false ) {
		throw new Error( 'Schema for validating object creation is required!' );
	}

	// check if update schema exist if required
	if ( getCustomMethod( 'update' ) !== false && updateSchema === false ) {
		throw new Error( 'Schema for validating object creation is required!' );
	}

	// create new CURD Collection
	curd = new CURDCollection({

		/**
		 * @desc handler for POST request for creating object
		 * @param req {object} - http request object
		 * @param res {object} - http response object
		 * @param obj {object} - JSON object with data
		 * @param cb {function(error, result)} - callback function which accepts two arguments:
		 * 										 error and result from DB query
		 */

		create: function( req, res, obj, cb ) {
			var query,
				customMethod = getCustomMethod( 'create' );

			// check if method is not disabled
			if ( customMethod !== false ) {

				// check if default DB query is not overwritten
				if ( typeof customMethod !== 'function' ) {
					query = dbCon.ins(
						dbTable,
						obj
					);
				} else {
					query = customMethod( obj );
				}

				cb();

//				query.then(
//					function( result ) {
//						cb( null, result );
//					},
//					function( err ) {
//						res.status.internalServerError( err );
//					}
//				);
			} else {
				res.statusCode = 405;
				res.end();
			}
		},

		/**
		 * @desc handler for DELETE request for deleting object
		 * @param req {object} - http request object
		 * @param res {object} - http response object
		 * @param id {string} - object id
		 * @param cb {function(error, result)} - callback function which accepts two arguments:
		 * 										 error and result from DB query
		 */

		destroy: function( req, res, id, cb ) {
			var query,
				customMethod = getCustomMethod( 'destroy' );

			// check if method is not disabled
			if ( customMethod !== false ) {

				// check if default DB query is not overwritten
				if ( typeof customMethod !== 'function' ) {
					query = dbCon.del(
						dbTable,
						{id: id}
					);
				} else {
					query = customMethod( id );
				}

				query.then(
					function( result ) {
						cb( null, result );
					},
					function( err ) {
						res.status.internalServerError( err );
					}
				);
			} else {
				res.statusCode = 405;
				res.end();
			}
		},

		/**
		 * @desc handler for GET request for getting single object
		 * @param req {object} - http request object
		 * @param res {object} - http response object
		 * @param cb {function(error, result)} - callback function which accepts two arguments:
		 * 										 error and result from DB query
		 */

		fetch: function( req, res, cb ) {
			var query = dbCon.sel(
				dbTable,
				dbColumns,
				{id: req.uri.child()}
			);

			query.then(
				function( data ) {
					// if no row returned send 404 object doesn't exist
					( data[0] ) ? cb( null, data[0] ) : cb( true );
				},
				function( err ) {
					res.status.internalServerError( err );
				}
			);
		},

		/**
		 * @desc handler for GET request for getting list of objects
		 * @param req {object} - http request object
		 * @param res {object} - http response object
		 * @param cb {function(error, result)} - callback function which accepts two arguments:
		 * 										 error and result from DB query
		 */

		list: function( req, res, cb ) {
			var query = dbCon.sel(
				dbTable,
				dbColumns
			);

			query.then(
				function( data ) {
					cb( null, data );
				},
				function( err ) {
					res.status.internalServerError( err );
				}
			);
		},

		/**
		 * @desc handler for PUT request for update single object
		 * @param req {object} - http request object
		 * @param res {object} - http response object
		 * @param id {string} - object id
		 * @param obj {object} - JSON object with data
		 * @param cb {function(error, result)} - callback function which accepts two arguments:
		 * 										 error and result from DB query
		 */

		update: function( req, res, id, obj, cb ) {
			var query,
				customMethod = getCustomMethod( 'update' );

			// check if method is not disabled
			if ( customMethod !== false ) {

				// check if default DB query is not overwritten
				if ( typeof customMethod !== 'function' ) {
					query = dbCon.upd(
						dbTable,
						obj,
						{id: id}
					);
				} else {
					query = customMethod( id, obj );
				}

				query.then(
					function( data ) {
						cb( null, data );
					},
					function( err ) {
						res.status.internalServerError( err );
					}
				);
			} else {
				res.statusCode = 405;
				res.end();
			}
		}
	});

	// set schemas either one for both create and update validation or two separate schemas for each action
	if ( createSchema ) {
		curd.createSchema = createSchema;
	}
	if ( updateSchema ) {
		curd.updateSchema = updateSchema;
	}

	return curd;
}

module.exports = {
	createCollection: createCollection
}