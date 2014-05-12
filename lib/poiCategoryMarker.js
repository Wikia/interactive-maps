'use strict';

var config = require('./config'),
	jobs = kue.createQueue(config),
	logger = require('./logger');

module.exports = {
	createProcessMarkerJob: function (poiCategoryId, marker, dbTable) {
		jobs.create('process_marker', {
			fileUrl: marker,
			dbTable: dbTable,
			poiCategoryId: poiCategoryId
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

	}
}