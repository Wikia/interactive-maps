/**
 * Module that handles getting background color for an tileset
 */
'use strict';

var getPixels = require('get-pixels'),
	Q = require('q'),
	logger = require('./logger'),

	channels = {
		chanelIdxRed: 0,
		chanelIdxGreen: 1,
		chanelIdxBlue: 2,
		chanelIdxAlpha: 3
	},

	defaultBgColor = '#ddd',
	aggregatedColors = {};

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
 * @desc Adds color data and counts amount of pixels with the color
 * @param {array} pixel
 */
function addAndCountColors(pixel) {
	var color = 'rgba(' + pixel.join(',') + ')';

	if (!aggregatedColors.hasOwnProperty(color)) {
		aggregatedColors[color] = 0;
	}

	aggregatedColors[color]++;
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
		bgColor,
		aggregatedColorsNo;

	logger.info('Getting image pixels for ' + imgSrc + '...');
	getPixels(imgPath, function (err, pixels) {
		if (err) {
			logger.error('Error while getting image pixels ' + JSON.stringify(err));
			//For transparent png get-pixels fails, so fall back to default color
			jobData.bgColor = defaultBgColor;
			deferred.resolve(jobData);
			return;
		}

		var dimensions = pixels.shape.slice(),
			imgWidth = dimensions[1],
			imgHeight = dimensions[0],
			i,
			sortedResults = [];

		// top & bottom borders
		for (i = 0; i < imgWidth; i++) {
			addAndCountColors(getColorObject(i, 0, pixels));
			addAndCountColors(getColorObject(i, imgHeight - 1, pixels));
		}

		// left & right borders
		for (i = 0; i < imgHeight; i++) {
			addAndCountColors(getColorObject(imgWidth - 1, i, pixels));
			addAndCountColors(getColorObject(0, i, pixels));
		}

		Object.keys(aggregatedColors).forEach(function (color) {
			sortedResults.push({
				color: color,
				count: aggregatedColors[color]
			});
		});

		aggregatedColors = sortedResults.sort(function (a, b) {
			return a.count - b.count;
		});

		aggregatedColorsNo = aggregatedColors.length;
		bgColor = aggregatedColors[aggregatedColorsNo - 1] ?
			aggregatedColors[aggregatedColorsNo - 1].color : defaultBgColor;
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
