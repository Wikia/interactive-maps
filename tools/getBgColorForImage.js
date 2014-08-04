'use strict';

var fs = require('fs'),
	Canvas = require('canvas'),
	_ = require('underscore'),

	Image = Canvas.Image,
	dir = __dirname + '/images/',
	mapImages = ['test.png', 'millenium_falcon.jpg', 'westeros.jpg', 'avatar.jpg', 'one_world.jpg'],
	mapImageName = mapImages[4],
	canvas,
	ctx,
	img,
	imgWidth,
	imgHeight,
	pixels = [],
	pixelData,
	results;

function pixelArrayToRgbArray(pixels) {
	var result = [],
		numPixels = pixels.data.length / 4;

	for (var i = 0; i < numPixels; i++) {
		result.push({
			'red': pixels.data[i*4],
			'green': pixels.data[i*4+1],
			'blue': pixels.data[i*4+2],
			'alpha': pixels.data[i*4+3]
		});
	}

	return result;
}

fs.readFile(dir + mapImageName, function (err, image) {
	if (err) {
		throw err;
	}

	console.log('Creating image and canvas with it...');
	img = new Image;
	img.src = dir + mapImageName;
	imgWidth = img.width;
	imgHeight = img.height;

	canvas = new Canvas(imgWidth, imgHeight);
	ctx = canvas.getContext('2d');
	ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

	console.log('Getting pixels data...');

	// top border
	pixelData = ctx.getImageData(0, 0, imgWidth, 1);
	pixels.push(pixelArrayToRgbArray(pixelData));

	// right border
	pixelData = ctx.getImageData(imgWidth - 1, 0, 1, imgHeight);
	pixels.push(pixelArrayToRgbArray(pixelData));

	// bottom border
	pixelData = ctx.getImageData(0, imgHeight - 1, imgWidth, 1);
	pixels.push(pixelArrayToRgbArray(pixelData));

	// left border
	pixelData = ctx.getImageData(0, 0, 1, imgHeight);
	pixels.push(pixelArrayToRgbArray(pixelData));

	results = _.countBy(_.flatten(pixels), function (pixel) {
		return 'rgba(' + pixel.red + ',' + pixel.green + ',' + pixel.blue + ',' + pixel.alpha + ')';
	});

	var sortedResults = [];
	_.each(results, function (key, value) {
		sortedResults.push({
			color: value,
			count: key
		})
	});

	results = _.sortBy(sortedResults, 'count');
	console.log('The most used color is: ' + results[results.length-1].color);
});
