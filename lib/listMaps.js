'use strict';

var dbCon = require('./db_connector');

/**
 * @desc custom query for all map instances filtered by city_id
 * @param dbTable {string} - name of db table
 * @param dbColumns
 * @param filter {object} - filter for db query (city_id)
 * @returns {object} - promise
 */

module.exports = function listMapInstances(dbTable, dbColumns, filter) {
	return dbCon.knex(dbTable)
		.join('tile_set', 'tile_set.id', '=', 'map.tile_set_id')
		.column([
			'map.id',
			'map.title',
			'tile_set.org_img'
		])
		.where({city_id: 1})
		.select();
};
