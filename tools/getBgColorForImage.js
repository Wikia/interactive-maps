'use strict';

var Canvas = require('canvas'),
	gm = require('gm'),
	_ = require('underscore'),

	Image = Canvas.Image,
	dir = __dirname + '/images/',
	mapImages = ['test.jpg', 'millenium_falcon.jpg', 'westeros.jpg', 'avatar.jpg', 'one_world.jpg'],
	mapImage = gm(dir + mapImages[0]).options({imageMagick: true}),
	canvas,
	ctx,
	img,
	pixels = new Array();

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

mapImage.size(function (err,res) {
	var pixelData;
	console.log('Getting the size...');

	if (err) {
		throw err;
	}

	console.log('Creating image and canvas with it...');
	img = new Image;
	img.src = dir + mapImages[0];

	canvas = new Canvas(res.width, res.height);
	ctx = canvas.getContext('2d');
	ctx.drawImage(img, 0, 0, img.width, img.height);

	console.log('Getting pixels data...');

	// top border
	pixelData = ctx.getImageData(0, 0, img.width - 1, 1);
	pixels.push(pixelArrayToRgbArray(pixelData));

	// right border
	pixelData = ctx.getImageData(img.width - 1, 0, 1, img.height - 1);
	pixels.push(pixelArrayToRgbArray(pixelData));

	// bottom border
	pixelData = ctx.getImageData(0, img.height - 1, img.width, 1);
	pixels.push(pixelArrayToRgbArray(pixelData));

	// left border
	pixelData = ctx.getImageData(0, 0, 1, img.height - 1);
	pixels.push(pixelArrayToRgbArray(pixelData));

	console.log(_.flatten(pixels));
	console.log('Done!');
});
