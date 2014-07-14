'use strict';
/**
 *  Module for connection with database, building and making queries.
 *  Knex is used as DB connector.
 */

var Knex = require('knex'),
	config = require('./config'),
	utils = require('./utils'),
	mysql = require('mysql'),
	Q = require('q'),

	// initialize database connection with empty pool
	knex = Knex.initialize({
		client: 'mysql',
		pool: {
			min: 0,
			max: 0
		}
	}),
	poolCluster = setupPool(config.db),
	connType = {
		master: 'master*',
		slave: 'slave*',
		all: '*'
	},
	dbConnectionRemovalThreshold = 100;

/**
 * @desc Set up the database connection pool cluster
 * @param {object} config
 * @returns {object} PoolCluster
 */
function setupPool(config) {
	var poolCluster = mysql.createPoolCluster({
		removeNodeErrorCount: dbConnectionRemovalThreshold
	});

	if (!config.hasOwnProperty('master')) {
		// Support for old config
		poolCluster.add('master1', config);
	} else {
		Object.keys(config).forEach(function (key) {
			config[key].forEach(function (connectionConfig, index) {
				poolCluster.add(key + index, connectionConfig);
			});
		});
	}
	return poolCluster;
}

/**
 * @desc Get connection from the pool cluster
 *
 * @param {string} type Type of connection defined in connType
 * @param {function} callback Optional callback function
 * @param {function} error Optional Error callback function
 * @returns {object} Promise
 */
function getConnection(type, callback, error) {
	var deferred = Q.defer();
	type = type || connType.all;
	poolCluster.getConnection(type, function (err, connection) {
		if (err) {
			if (utils.isFunction(error)) {
				error(connection);
			}
			deferred.reject(err);
		} else {
			if (utils.isFunction(callback)) {
				callback(connection);
				connection.release();
			}
			deferred.resolve(connection);
		}
	});
	return deferred.promise;
}

/**
 * @desc function for creating SELECT query
 *
 * @param {object} conn  Database connection
 * @param {string} table - table name
 * @param {array} columns - table columns
 * @param {object} where - object with WHERE query params
 * @returns {object} - query object which could be executed as a promise with .then() or with callback using .exec()
 */

function select(connnection, table, columns, where) {
	var query = knex(table).column(columns).connection(connnection);

	if (where) {
		query.where(where);
	}

	return query.select();
}

/**
 * @desc function for creating INSERT query
 *
 * @param {object} conn  Database connection
 * @param {string} table - table name
 * @param {object} data - JSON object with data to be inserted
 * @returns {object} - query object which could be executed as a promise with .then() or with callback using .exec()
 */

function insert(connection, table, data) {
	return knex(table).insert(data).connection(connection);
}

/**
 * @desc function for creating DELETE query
 *
 * @param {object} conn  Database connection
 * @param {string} table - table name
 * @param {object} where - JSON object with WHERE params
 * @returns {object} - query object which could be executed as a promise with .then() or with callback using .exec()
 */

function destroy(connection, table, where) {
	return knex(table).where(where).del().connection(connection);
}

/**
 * @desc function for creating UPDATE query
 *
 * @param {object} conn  Database connection
 * @param {string} table - table name
 * @param {object} data - JSON object with data to be updated
 * @param {object} where - JSON object with WHERE params
 * @returns {object} - query object which could be executed as a promise with .then() or with callback using .exec()
 */

function update(connection, table, data, where) {
	return knex(table).where(where).update(data).connection(connection);
}

/**
 * @desc returns knex raw value for field
 *
 * Useful for CURRENT_TIMESTAMP or SQL functions
 *
 * @param {string} value
 * @returns {object}
 */
function raw(value) {
	return knex.raw(value);
}

// Public API

module.exports = {
	select: select,
	insert: insert,
	destroy: destroy,
	update: update,
	raw: raw,
	// TODO: figure out how to facade joins so knex api is not used outside this module
	knex: knex,
	getConnection: getConnection,
	connType: connType
};
