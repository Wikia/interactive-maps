'use strict';

var sys = require('sys'),
	exec = require('child_process').exec,
	fs = require('fs'),
	path = require('path'),
	sizeOf = require('image-size'),
	kue = require('kue'),
	jobs = kue.createQueue();

var tmpDir = '/tmp',
	workDir = '/maps',
	RATIO_LIMIT = 0.01,
	IMAGE_FORMAT = 'png';

function process( imageFile, outputDir ) {
	var originalImageName = path.basename( imageFile );
	//imageFile = fs.realpath(imageFile)

	var dimensions = sizeOf(imageFile);

	console.log('Original size: ', dimensions.width, dimensions.height);

//	var newSize = calculateNewImageSize( dimensions.width, dimensions.height),
//		newWidth = newSize[0],
//		newHeight = newSize[1];
//
//	console.log('New size: ', newWidth, newHeight);
//
//	if ( dimensions.width !== newWidth || dimensions.height !== newHeight ) {
//		console.log(imageFile + '   asd')
//		imageFile = resizeImage( imageFile, newWidth, newHeight );
//	}

	var maxZoomLevel = getMaxZoomLevel( Math.max( dimensions.width, dimensions.height ));
	console.log('Max zoom level', maxZoomLevel);

	var tempTilesDir = generateTiles( imageFile, 0, maxZoomLevel),
		mapId = insertMap({
			name: 'Map from ' +  originalImageName,
			min_zoom: 0,
			max_zoom: maxZoomLevel,
			width: dimensions.width,
			height: dimensions.height
		});

	return 'done';
	//return moveTiles( tempTilesDir, mapId );
}

function getImageSize( imageFile ) {
	return getimagesize( imageFile );
}

function getMaxZoomLevel( size ) {
	return 2;//~~Math.log( size, 2 );
}

function generateTiles( imageFile, minZoomLevel, maxZoomLevel ) {
	var workingDir = __dirname + '/' + workDir + '/',
		tempDir = tempname( workingDir, 'DIR_' ),
		cmd = 'gdal2tiles.py -p raster -z ' + minZoomLevel + '-' + maxZoomLevel + ' -w none '+imageFile+' ' + tempDir;

	console.log(cmd);

	exec(cmd, function (error, stdout, stderr) {
		console.log('stdout: ' + stdout);
		console.log('stderr: ' + stderr);

		if (error !== null) {
			console.log('exec error: ' + error);
		}
	});

	return tempDir;
}

function tempname( dir, prefix, suffix ){
	console.log(dir + 'asd')
	prefix = prefix || '';
	suffix = suffix || '';
	return fs.realpathSync( dir )  + '/' +  prefix + (+new Date()) + suffix;
}

function insertMap( mapData ) {
	var sql = "INSERT INTO map (name, min_zoom, max_zoom, width, height, map_type) VALUES(:name, :min_zoom, :max_zoom, :width, :height, :map_type);";
	exec(sql);
	return 0;// last id;
}

function moveTiles( tempTilesDir, mapId ) {
	//add to queue
	var destinationDir = fs.realpathSync('./maps/tiles') + '/' + mapId;

	log(sprintf('Moving from "%s" to "%s"', tempTilesDir, destinationDir));

	return rename( tempTilesDir, destinationDir );
}

function resizeImage( imageFile, width, height ) {
	var out_dir = __dirname + workDir + '/',
		newName = tempname( out_dir, 'map_', '.' + IMAGE_FORMAT),
		cmd = 'gdal_translate -of ' + IMAGE_FORMAT + ' -outsize ' + width + ' ' + height + ' ' + imageFile + ' ' + newName;

	console.log(cmd);

	exec(cmd, function (error, stdout, stderr) {
		console.log('stdout: ' + stdout);
		console.log('stderr: ' + stderr);

		if (error !== null) {
			console.log('exec error: ' + error);
		}
	});
}

function calculateNewImageSize( width, height ) {
	var ratio = width / height,
		newWidth = Math.pow( 2, Math.ceil( Math.log( width, 2 ) )),
		newHeight = Math.pow( 2, Math.ceil( Math.log( height, 2 ) ) ),
		newRatio = (newWidth / newHeight);

	console.log('Old ratio "' + ratio + '", new ratio "' + newRatio + '"');

	if ( Math.abs( ratio - newRatio) > RATIO_LIMIT ) {
		newHeight = height * ( newWidth / width );
	}

	return [ newWidth, newHeight ];
}

exports.process = process;
