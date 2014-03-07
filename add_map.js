/**
 * Module that takes care of:
 * - uploading a file to temp dir
 * - creating all necessary queue tasks to generate all necessary tiles
 * - updating database
 * - sending tiles to DFS
 *
 * Downloading and cutting first 0-2 zoom levels has highest priority
 * so users don't have to wait long for next steps of creating maps
 */

'use strict';

//TODO: Move to config
var config = {
		db: {
			host: 'localhost',
			user: 'root',
			auth: ''
		},
		minZoom: 0,
		maxZoom: 2,
		firstBatchZoomLevels: 4,
		redis: {
			port: 6379,
			host: 'localhost',
			password: ''
		},
		kue: {
			port: 3000,
			title: 'Interactive Maps Queue',
			maxFetchJobs: 1,
			maxCutTilesJobs: 1
		}
	},
	sys = require('sys'),
	os = require('os'),
	Q = require('q'),
	fs = require('fs'),
	path = require('path'),
	mysql = require('mysql'),
	sizeOf = require('image-size'),
	fetchFile = require('./fetchImage'),
	generateTiles = require('./generateTiles'),
	optimizeTiles = require('./optimizeTiles'),
	uploadTiles = require('./uploadTiles'),
	cleanupTiles= require('./cleanupTiles'),
	kue = require('kue'),
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
	var file = job.data.file,
		dir = job.data.dir,
		minZoom = job.data.minZoom,
		maxZoom = job.data.maxZoom;

	generateTiles( file, dir, minZoom, maxZoom )
		.then(optimizeTiles)
		.then(uploadTiles)
		.then(cleanupTiles)
		.then(insertMap)
		.then(done)
		.catch(function (error) {
			done(error)
		})
		.done();
});

jobs.process('process', config.kue.maxFetchJobs, function(job, done){
	fetchFile(job.data.fileUrl, job.data.to).then(function cut( imageFile, fileName ){
		var dimensions = sizeOf( imageFile ),
			maxZoomLevel = getMaxZoomLevel( dimensions.width, dimensions.height),
			dir = tempName( 'TILES_', fileName ),
			firstMaxZoomLevel = Math.min(config.minZoom + config.firstBatchZoomLevels, maxZoomLevel);

		console.log('Original size:', dimensions.width, dimensions.height);
		console.log('Max zoom level:', maxZoomLevel);
		console.log('First batch levels:', config.minZoom, firstMaxZoomLevel);

		jobs.create('tiling', {
			file: imageFile,
			dir: dir,
			minZoom: config.minZoom,
			maxZoom: firstMaxZoomLevel
		})
		.priority( 'high' )
		.save();

		for(var i = firstMaxZoomLevel+1; i <= maxZoomLevel; i++) {
			jobs.create('tiling', {
				file: imageFile,
				dir: dir,
				minZoom: i,
				maxZoom: i
			})
			.priority( 'low' )
			.save();
		}

		done();
	});
});

function getMaxZoomLevel( width, height ) {
	var size = Math.max( width, height );

	return Math.min( ~~Math.log( size, 2 ), config.maxZoom );
}

function tempName( prefix, fileName ){
	return mapsDir + prefix + fileName + '_' + (+new Date()) ;
}

function insertMap( mapData ) {
	var deferred = Q.defer();
	//create bucket
	//upload images
	console.log('Updating DB for:');
	deferred.resolve();

	return deferred;
//	connection.connect();
//
//	connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
//		if (err) throw err;
//
//		console.log('The solution is: ', rows[0].solution);
//	});
//
//	connection.end();
//
//	var sql = "INSERT INTO map (name, min_zoom, max_zoom, width, height, map_type) VALUES(:name, :min_zoom, :max_zoom, :width, :height, :map_type);";
//	exec(sql);
//	return 0;// last id;
}

module.exports = function process( fileUrl ) {
	jobs.create('process', {
		fileUrl: fileUrl,
		to: mapsDir
	})
	.priority('high')
	.save();
};
