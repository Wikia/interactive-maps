#!/usr/bin/env node
'use strict';

/**
 * MWEB-983
 *
 * The script loops through all POIs of given map,
 * and replaces part of link URL matching given pattern with a given string.
 *
 * It's useful for maps migration from one community to the other, when whole community was migrated and article titles
 * on new community are matching tiles from old one (only the domain part of the URL was changed)
 *
 * This script is required for Palantir release
 */

var dbCon = require('../lib/db_connector'),
	utils = require('../lib/utils'),
	squidUpdate = require('../lib/squidUpdate'),

	table = 'poi',
	args = process.argv.slice(2),
	mapId = parseInt(args[0], 10),
	find = args[1],
	replace = args[2];

/**
 * @desc validates process arguments
 * @param {Number} mapId
 * @param {String} find
 * @param {String} replace
 * @throws {Error} - if validation fail
 * @returns {boolean} - true if validation pass
 */
function validateArgs(mapId, find, replace) {
	if (typeof mapId !== 'number' || mapId % 1 !== 0) {
		throw new Error('mapId argument must be integer');
	}

	[find, replace].forEach(function (arg) {
		if (typeof arg !== 'string' || arg.trim().length === 0) {
			throw new Error('find and replace arguments must be non empty strings');
		}
	});

	return true;
}

/**
 * @desc Get all POIs for given map
 * @param {Object} conn - db connection
 * @param {Number} mapId - id of the map that POIs are linked to
 * @returns {Object}
 */
function getAllPoisOnMap(conn, mapId) {
	return dbCon.select(
		conn,
		table,
		['id', 'link'],
		{
			map_id: mapId
		}
	);
}

/**
 * @desc replaces the 'find' string with 'replace' string in link column and updates the POI in db
 * @param {Object} conn - DB connection object
 * @param {Number} poiId - id of Point Of Interest
 * @param {String} newLink - updated POI link to switch to in DB
 */

function updatePoiLink(conn, poiId, newLink) {
	return dbCon.update(conn, table,
		{
			link: newLink
		},
		{
			id: poiId
		}
	);
}

/**
 * @desc Sets up new links for POIS, updates DB and purges the map
 * @param {Object} conn - DB connection object
 * @param {Array} pois - collection of POI objects from DB
 */
function processPois(conn, pois) {
	var newLink;

	pois.forEach(function (poi) {
		newLink = poi.link.replace(find, replace);
		if (poi.link !== newLink) {
			updatePoiLink(conn, poi.id, newLink).then(function () {
				squidUpdate.purgeKey(
					utils.surrogateKeyPrefix + mapId,
					'mapPoiUpdated'
				);
				if (poi === pois[pois.length - 1]) {
					//by default knex doesnt close the connection to db
					process.exit();
				}
			});
		}
		console.log('All requests to DB sent');
	});
}

/**
 * @desc Callback after establishing connection with DB
 * @param {Object} conn - DB connection object
 */
function onConnection(conn) {
	getAllPoisOnMap(conn, mapId).then(function (pois) {
		processPois(conn, pois);
	});
}

/**
 * @desc Entrypoint to the script
 */
function start() {
	validateArgs(mapId, find, replace);
	dbCon.getConnection(dbCon.connType.master, onConnection);
}

start();
