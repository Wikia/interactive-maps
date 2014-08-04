'use strict';

var getPixels = require('get-pixels'),
	underscore = require('underscore'),

	dir = __dirname + '/images/',
	mapImages = ['test.png', 'millenium_falcon.jpg', 'westeros.jpg', 'avatar.jpg', 'one_world.jpg'],
	mapImageName = mapImages[0];

function getColorObject(x, y, pixels) {
	return {
		'red': pixels.get(y, x, 0),
		'green': pixels.get(y, x, 1),
		'blue': pixels.get(y, x, 2),
		'alpha': pixels.get(y, x, 3)
	};
}

console.log('Getting image pixels for ' + mapImageName + '...');
getPixels(dir + mapImageName, function (err, pixels) {
	if (err) {
		throw err;
	}

	var dimensions = pixels.shape.slice(),
		imgWidth = dimensions[1],
		imgHeight = dimensions[0],
		i,
		results = [],
		sortedResults = [];

	// top border
	for (i = 0; i < imgWidth; i++) {
		results.push(getColorObject(i, 0, pixels));
	}

	// left border
	for (i = 0; i < imgHeight; i++) {
		results.push(getColorObject(49, i, pixels));
	}

	// bottom border
	for (i = 0; i < imgWidth; i++) {
		results.push(getColorObject(i, 49, pixels));
	}

	// right border
	for (i = 0; i < imgWidth; i++) {
		results.push(getColorObject(0, i, pixels));
	}

	results = underscore.countBy(underscore.flatten(results), function (pixel) {
		return 'rgba(' + pixel.red + ',' + pixel.green + ',' + pixel.blue + ',' + pixel.alpha + ')';
	});

	underscore.each(results, function (key, value) {
		sortedResults.push({
			color: value,
			count: key
		});
	});

	results = underscore.sortBy(sortedResults, 'count');
	console.log('The most used color is: ' + results[results.length - 1].color);
});
