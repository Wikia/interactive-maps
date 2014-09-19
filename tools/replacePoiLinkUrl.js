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
	poiIndexer = require('../lib/poiIndexer'),

	table = 'poi',
	args = process.argv.slice(2),
	mapId = +args[0],
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
 * @param {Number} mapId
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
 * @param {Object} conn
 * @param {Number} poiId - id of Point Of Interest
 * @param {String} newLink -
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

validateArgs(mapId, find, replace);

function start() {
	dbCon.getConnection(dbCon.connType.master, onConnection);
}

function onConnection(conn) {
	getAllPoisOnMap(conn, mapId).then(function (pois) {
		processPois(conn, pois);
	});
}

function processPois(conn, pois) {
	var newLink;
	pois.forEach(function (poi) {
		newLink = poi.link.replace(find, replace);
		if (poi.link !== newLink) {
			updatePoiLink(conn, poi.id, newLink).then(function () {
				poiIndexer.addPoiDataToQueue(conn, poiIndexer.poiOperations.update, poi.id);
			});
		}
	});
}

start();
