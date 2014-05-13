'use strict';

var config = require('./config'),
	logger = require('./logger'),
	kue = require('kue'),
	jobs = kue.createQueue(config);

/**
 * @desc Create background job for processing POI Category marker
 *
 * @param poiCategoryId {number} - poi_category id
 * @param mapId {number} - map id
 * @param marker {string} - poi category marker url
 * @param dbTable {string} - poi category table name
 */
module.exports = function poiCategoryMarker (poiCategoryId, mapId, marker, dbTable) {
	jobs.create('process_marker', {
		fileUrl: marker,
		dbTable: dbTable,
		poiCategoryId: poiCategoryId,
		mapId: mapId
	})
	.priority('high')
	.attempts(config.kue.fetchJobsAttempts || 1)
	.save()
	.on('complete', function () {
		logger.debug('Job process_marker complete ' + poiCategoryId + ' ' + marker);
	}).on('failed', function () {
		logger.error('Job process_marker failed ' + poiCategoryId + ' ' + marker);
	}).on('failed attempt', function () {
		logger.warning('Job process_marker failed but will retry ' + poiCategoryId + ' ' + marker);
	});
};
