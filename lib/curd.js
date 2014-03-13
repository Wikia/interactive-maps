/**
 *	This module is responsible ofr creating CURD collections for Percolator.js
 *	It has a factory method 'createCollection' which returns new CURDCollection based on schema passed as an argument
 */

'use strict';

var dbCon = require( './db_connector' ),
	CURDCollection = require( 'percolator' ).CRUDCollection;

function createCollection( schema ) {

	// validate schema type
	if ( typeof schema !== 'object' ) {
		throw new Error( 'Schema should be an object!' );
	}

	// check if schema has all required properties
	if ( !schema.hasOwnProperty( 'dbTable' ) ||
		!schema.hasOwnProperty( 'dbColumns' ) ||
		!schema.hasOwnProperty( 'createSchema' ) ||
		!schema.hasOwnProperty( 'updateSchema' )
		) {
		throw new Error( 'One of schema properties is missing! Should have [ dbTable, dbColumns, createSchema, updateSchema ]' );
	}


	// store all schema related stuff in local variables
	var dbTable = schema.dbTable,
		dbColumns = schema.dbColumns,
		createSchema = schema.createSchema,
		updateSchema = schema.updateSchema,
		responseSchema = schema.responseSchema,

		// create new CURD Collection
		curd = new CURDCollection({

			// set schemas either one for both create and update validation or two separate schemas for each action
			createSchema: createSchema,
			updateSchema: updateSchema,

			/**
			 * @desc handler for POST request for creating object
			 * @param req {object} - http request object
			 * @param res {object} - http response object
			 * @param obj {object} - JSON object with data
			 * @param cb {function(error, result)} - callback function which accepts two arguments:
			 * 										 error and result from DB query
			 */

			create: function( req, res, obj, cb ) {
				var query = dbCon.ins(
					dbTable,
					obj
				);

				query.then(
					function( result ) {
						cb( null, result );
					},
					function( err ) {
						res.status.internalServerError( err );
					}
				);
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
				var query = dbCon.del(
					dbTable,
					{id: id}
				);

				query.then(
					function( result ) {
						cb( null, result );
					},
					function( err ) {
						res.status.internalServerError( err );
					}
				);
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

			update : function( req, res, id, obj, cb ) {
				var query = dbCon.upd(
					dbTable,
					obj,
					{id: id}
				);

				query.then(
					function( data ) {
						cb( null, data );
					},
					function( err ) {
						res.status.internalServerError( err );
					}
				);
			}
		});

		return curd;
	}

module.exports = {
	createCollection: createCollection
}