/**
 * Module that handles getting background color for an tileset
 */
'use strict';
var getPixels = require('get-pixels'),
	underscore = require('underscore'),
	Q = require('q'),
	logger = require('./logger'),

	channels = {
		chanelIdxRed: 0,
		chanelIdxGreen: 1,
		chanelIdxBlue: 2,
		chanelIdxAlpha: 3
	},

	defaultBgColor = '#ddd';

/**
 * @desc Gets colors for pixels from RGBA array and returns object
 * @param {integer} x
 * @param {integer} y
 * @param {object} pixels
 * @returns {object}
 */
function getColorObject(x, y, pixels) {
	var result = [],
		channel;

	Object.keys(channels).forEach(function (key) {
		channel = channels[key];
		result[channel] = pixels.get(y, x, channel);
	});

	return result;
}

/**
 * @desc Gets all pixels colors from an image and calculate the background color
 * @param {object} jobData - a job object with image data
 * @returns {object} - promise
 */
function getBgColorForImage(jobData) {
	var deferred = Q.defer(),
		imgSrc = jobData.image,
		imgPath = jobData.dir + imgSrc,
		bgColor;

	logger.info('Getting image pixels for ' + imgSrc + '...');
	getPixels(imgPath, function (err, pixels) {
		if (err) {
			logger.error('Error while getting image pixels ' + JSON.stringify(err));
			deferred.reject(err);
			return;
		}

		var dimensions = pixels.shape.slice(),
			imgWidth = dimensions[1],
			imgHeight = dimensions[0],
			i,
			results = [],
			sortedResults = [];

		// top & bottom borders
		for (i = 0; i < imgWidth; i++) {
			results.push(getColorObject(i, 0, pixels));
			results.push(getColorObject(i, imgHeight - 1, pixels));
		}

		// left & right borders
		for (i = 0; i < imgHeight; i++) {
			results.push(getColorObject(imgWidth - 1, i, pixels));
			results.push(getColorObject(0, i, pixels));
		}

		results = underscore.countBy(underscore.flatten(results), function (pixel) {
			return 'rgba(' + pixel.join(',') + ')';
		});

		underscore.each(results, function (key, value) {
			sortedResults.push({
				color: value,
				count: key
			});
		});

		results = underscore.sortBy(sortedResults, 'count');
		bgColor = (typeof results[results.length - 1] === 'undefined') ?
			defaultBgColor : results[results.length - 1].color;
		jobData.bgColor = bgColor;
		logger.info('Background color found: ' + bgColor);
		deferred.resolve(jobData);
	});

	return deferred.promise;
}

module.exports = {
	getColorObject: getColorObject,
	getBgColorForImage: getBgColorForImage
};
