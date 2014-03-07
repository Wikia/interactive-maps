/**
 * Module that takes care of:
 * - uploading a file to temp dir
 * - creating all necessary queue tasks to generate all necessary tiles
 * - updating database
 * - sending tiles to DFS
 *
 * Downloading and cutting first 0-4 zoom levels has highest priority
 * so users don't have to wait long for next steps of creating maps
 */

'use strict';

var config = require('./config'),
	sys = require('sys'),
	os = require('os'),
	Q = require('q'),
	fs = require('fs'),
	path = require('path'),
	mysql = require('mysql'),
	sizeOf = require('image-size'),
	kue = require('kue'),
	fetchImage = require('./fetchImage'),
	generateTiles = require('./generateTiles'),
	optimizeTiles = require('./optimizeTiles'),
	uploadTiles = require('./uploadTiles'),
	cleanupTiles= require('./cleanupTiles'),
	jobs = kue.createQueue(config),
	connection = mysql.createConnection(config.db),
	tmpDir = os.tmpdir() + 'int_map/',
	mapsDir = tmpDir + 'maps/';

//setup folders
if ( !fs.existsSync( tmpDir ) ) {
	fs.mkdirSync( tmpDir );
}

if ( !fs.existsSync( mapsDir ) ) {
	fs.mkdirSync( mapsDir );
}

kue.app.set('title', config.kue.title);
kue.app.listen(config.kue.port);

console.log('Kue is listening on port', config.kue.port);

jobs.process('tiling', config.kue.maxCutTilesJobs, function(job, done){
	generateTiles( job.data )
		.then(optimizeTiles)
		.then(uploadTiles)
		.then(cleanupTiles)
		.then(insertMap)
		.then(done)
		.catch(done)
		.done();
});

function createJobDataGetter(image, dir, dimensions, data){
	return function(minZoom, maxZoom, firstJob){
		return {
			image: image,
			dir: dir,
			minZoom: minZoom,
			maxZoom: maxZoom || minZoom,
			width: dimensions.width,
			height: dimensions.height,
			user: data.user,
			name: data.name,
			firstJob: firstJob
		};
	}
}

function setupTiling( data ) {
	var deferred = Q.defer(),
		fullPath = data.dir + data.image,
		dimensions = sizeOf( fullPath ),
		maxZoomLevel = getMaxZoomLevel( dimensions.width, dimensions.height),
		dir = tempName( 'TILES_', data.image ),
		firstMaxZoomLevel = Math.min(config.minZoom + config.firstBatchZoomLevels, maxZoomLevel),
		jobData = createJobDataGetter(fullPath, dir, dimensions, data);

	console.log('Original size:', dimensions.width, dimensions.height);
	console.log('Max zoom level:', maxZoomLevel);
	console.log('First batch levels:', config.minZoom, firstMaxZoomLevel);

	jobs.create('tiling', jobData(config.minZoom, firstMaxZoomLevel, true))
		.priority( 'high' )
		.save();

	for(var i = firstMaxZoomLevel+1; i <= maxZoomLevel; i++) {
		jobs.create('tiling', jobData(i))
			.priority( 'low' )
			.save();
	}

	deferred.resolve();

	return deferred.promise;
}

jobs.process('process', config.kue.maxFetchJobs, function(job, done){
	fetchImage( job.data )
		.then(setupTiling)
		.then(done);
});

function getMaxZoomLevel( width, height ) {
	var size = Math.max( width, height );

	return Math.min( ~~Math.log( size, 2 ), config.maxZoom );
}

function tempName( prefix, fileName ){
	return mapsDir + prefix + fileName;//+ '_' + (+new Date()) ;
}

function insertMap( data ) {
	var deferred = Q.defer(),
		updateQuery = 'UPDATE map SET max_zoom=? WHERE name=?',
		insertQuery = 'INSERT INTO map (name, type, width, height, min_zoom, max_zoom, created_by) VALUES(?, ?, ?, ?, ?, ?, ?)';

	if ( data.firstJob ) {
		//TODO Create instance of a map
		//TODO Notify user that map is ready to be edited
		console.log('Saving:', [data.name, data.type || 'custom', data.width, data.height, data.minZoom, data.maxZoom, data.user]);

		connection.query(
			insertQuery,
			[data.name, data.type || 'custom', data.width, data.height, data.minZoom, data.maxZoom, data.user],
			function(err, result) {
				if (!err) {
					console.log('Saved:', data.name);

					deferred.resolve({
						id: result.insertId
					});
				} else {
					deferred.reject(err);
				}
			}
		);
	} else {
		console.log('Updating:', [data.name, data.maxZoom]);

		connection.query(
			updateQuery,
			[data.maxZoom, data.name],
			function(err, result) {
				if (!err) {
					console.log('Updated:', data.name);

					deferred.resolve();
				} else {
					deferred.reject(err);
				}
			}
		);
	}

	return deferred.promise;
}

module.exports = function process( fileUrl, name, user ) {
	jobs.create('process', {
		fileUrl: fileUrl,
		name: name,
		dir: mapsDir,
		user: user
	})
	.priority('high')
	.save();
};
