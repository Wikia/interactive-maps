'use strict';

var gm = require('gm'),
	Q = require('q'),
	fs = require('fs'),

	dir = __dirname + '/images/',
	mapImages = ['millenium_falcoln.jpg', 'westeros.jpg', 'avatar.jpg', 'one_world.jpg'],
	img = gm(dir + mapImages[3])
		.options({imageMagick: true}),
	imgData = {},
	defaultCropSize = 50,
	tempFiles = {
		top: 'top.jpg',
		right: 'right.jpg',
		bottom: 'bottom.jpg',
		left: 'left.jpg',
		combined: 'combined.jpg'
	};

function identifyImage(image) {
	var deferred = Q.defer();

	image.identify(function (err, results) {
		if (err) {
			deferred.reject(err);
			return;
		}

		deferred.resolve(results);
	});

	return deferred.promise;
}

function crop(width, height, x, y, newImgName) {
	var deferred = Q.defer();

	img
		.crop(width, height, x, y)
		.write(dir + newImgName, function (err) {
			if (err) {
				deferred.reject(err);
				return;
			}

			// console.log(this.outname + " created :: " + arguments[3]);
			deferred.resolve();
		});

	return deferred.promise;
}

function rotate() {
	var deferred = Q.defer();

	console.log('Rotating...');

	gm(dir + tempFiles.right)
		.options({imageMagick: true})
		.rotate('#f00', 90)
		.write(dir + tempFiles.right, function (err) {
			if (err) {
				console.log(arguments);
				deferred.reject(err);
			}

			// console.log(this.outname + " created  ::  " + arguments[3]);
		});

	gm(dir + tempFiles.left)
		.options({imageMagick: true})
		.rotate('#f00', 90)
		.write(dir + tempFiles.left, function (err) {
			if (err) {
				console.log(arguments);
				deferred.reject(err);
			}

			// console.log(this.outname + " created  ::  " + arguments[3]);
			deferred.resolve();
		});

	return deferred.promise;
}

function combine() {
	var deferred = Q.defer();

	console.log('Combining...');

	gm(dir + tempFiles.top)
		.options({imageMagick: true})
		.append(dir + tempFiles.right, dir + tempFiles.bottom, dir + tempFiles.left)
		.write(dir + tempFiles.combined, function (err) {
			if (err) {
				console.log(err);
				deferred.reject(err);
			} else {
				// console.log(this.outname + " created  ::  " + arguments[3]);
				require('child_process').exec('open ' + dir + tempFiles.combined);
				deferred.resolve();
			}
		});

	return deferred.promise;
}

function handleError(err) {
	if (err) {
		console.log(err);
	}
}

identifyImage(img).then(function (results) {
	var rightCropX = parseInt(imgData.width - defaultCropSize, 10),
		bottomCropX = parseInt(imgData.height - defaultCropSize, 10);

	console.log('Getting image data...');

	imgData.width = results.size.width;
	imgData.height = results.size.height;
	imgData.channelStats = results['Channel statistics'];

	console.log('Cropping...');

	crop(imgData.width, defaultCropSize, 0, 0, tempFiles.top).then(function () {
			crop(defaultCropSize, imgData.height, rightCropX, 0, tempFiles.right).then(function () {
					crop(imgData.width, defaultCropSize, bottomCropX, 0, tempFiles.bottom).then(function () {
							crop(defaultCropSize, imgData.height, 0, 0, tempFiles.left).then(function () {
									rotate().then(function () {
											combine().then(function () {
												var combinedImg = gm(
													dir + tempFiles.combined
												).options({imageMagick: true});

												identifyImage(combinedImg).then(function (results) {
													var combinedImgData = [];

													combinedImgData.width = results.size.width;
													combinedImgData.height = results.size.height;
													combinedImgData.channelStats = results['Channel statistics'];

													console.log('Original image mean color:');
													console.log('R: ' + imgData.channelStats.Red.mean);
													console.log('G: ' + imgData.channelStats.Green.mean);
													console.log('B: ' + imgData.channelStats.Blue.mean);

													console.log('Combined image:');
													console.log('R: ' + combinedImgData.channelStats.Red.mean);
													console.log('G: ' + combinedImgData.channelStats.Green.mean);
													console.log('B: ' + combinedImgData.channelStats.Blue.mean);

													console.log('Removing temporary files...');
													for (var fileName in tempFiles) {
														if (tempFiles.hasOwnProperty(fileName)) {
															fs.unlink(dir + tempFiles[fileName], handleError);
														}
													}
													console.log('Done!');
												});
											});
									});
							});
					});
			});
	});
});
