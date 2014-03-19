/**
 *  Module for connection with database, building and making queries.
 *  Knex is used as DB connector.
 */

var Knex = require('knex'),
	config = require('./config'),
	knex;

// initialize database connection
Knex.knex = Knex.initialize({
	client: 'mysql',
	connection: config.db
});

knex = Knex.knex;

/**
 * @desc function for creating SELECT query
 * @param table {string} - table name
 * @param columns {array} - table columns
 * @param where {object} - object with WHERE query params
 * @returns {object} - query object which could be executed as a promise with .then() or with callback using .exec()
 */

function sel(table, columns, where) {
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

function ins(table, data) {
	return knex(table).insert(data);
}

/**
 * @desc function for creating DELETE query
 * @param table {string} - table name
 * @param where {object} - JSON object with WHERE params
 * @returns {object} - query object which could be executed as a promise with .then() or with callback using .exec()
 */

function del(table, where) {
	return knex(table).where(where).del();
}

/**
 * @desc function for creating UPDATE query
 * @param table {string} - table name
 * @param data {object} - JSON object with data to be updated
 * @param where {object} - JSON object with WHERE params
 * @returns {object} - query object which could be executed as a promise with .then() or with callback using .exec()
 */

function upd(table, data, where) {
	return knex(table).where(where).update(data);
}

module.exports = {
	sel: sel,
	ins: ins,
	del: del,
	upd: upd
}
