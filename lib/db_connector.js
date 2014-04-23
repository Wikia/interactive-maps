/**
 *  Module for connection with database, building and making queries.
 *  Knex is used as DB connector.
 */

var Knex = require('knex'),
	config = require('./config'),
	// initialize database connection
	knex = Knex.initialize({
		client: 'mysql',
		connection: config.db
	});

/**
 * @desc function for creating SELECT query
 * @param table {string} - table name
 * @param columns {array} - table columns
 * @param where {object} - object with WHERE query params
 * @returns {object} - query object which could be executed as a promise with .then() or with callback using .exec()
 */

function select(table, columns, where) {
	var query = knex(table).column(columns);

	if (where) {
		query.where(where);
	}

	return query.select();
}

/**
 * @desc function for creating INSERT query
 * @param table {string} - table name
 * @param data {object} - JSON object with data to be inserted
 * @returns {object} - query object which could be executed as a promise with .then() or with callback using .exec()
 */

function insert(table, data) {
	return knex(table).insert(data);
}

/**
 * @desc function for creating DELETE query
 * @param table {string} - table name
 * @param where {object} - JSON object with WHERE params
 * @returns {object} - query object which could be executed as a promise with .then() or with callback using .exec()
 */

function destroy(table, where) {
	return knex(table).where(where).del();
}

/**
 * @desc function for creating UPDATE query
 * @param table {string} - table name
 * @param data {object} - JSON object with data to be updated
 * @param where {object} - JSON object with WHERE params
 * @returns {object} - query object which could be executed as a promise with .then() or with callback using .exec()
 */

function update(table, data, where) {
	return knex(table).where(where).update(data);
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
	// TODO: figure out how to fasade joins so knex api is not used outside this module
	knex: knex
}
