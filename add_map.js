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
		maxCutTilesJobs: 1,
		maxFetchImagesJobs: 1,
		minZoom: 1,
		maxZoom: 2,
		redis: {
			port: 6379,
			host: 'localhost',
			password: ''
		}
	},
	sys = require('sys'),
	os = require('os'),
	Q = require('q'),
	exec = require('child_process').exec,
	fs = require('fs'),
	path = require('path'),
	mysql = require('mysql'),
	sizeOf = require('image-size'),
	fetchFile = require('./fetchImage'),
	dfs = require('./dfs'),
	jobs = require('kue').createQueue(config),
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

jobs.process('sendTiles', function(){

});

jobs.process('cutTiles', config.maxCutTilesJobs, function(job, done){
	var file = job.data.file,
		dir = job.data.dir,
		minZoom = job.data.minZoom,
		maxZoom = job.data.maxZoom;

	generateTiles( file, dir, minZoom, maxZoom )
		.then(optimzeTiles)
		.then(uploadTiles)
		.then(cleanUpTiles)
		.then(insertMap)
		.then(function () {
			done()
		})
		.catch(function (error) {
			done(error)
		})
		.done();


//	insertMap({
//		name: 'Map from ' +  originalImageName,
//		min_zoom: MIN_ZOOM,
//		max_zoom: maxZoomLevel,
//		width: dimensions.width,
//		height: dimensions.height
//	});
});

jobs.process('fetchFile', config.maxFetchImagesJobs, function(job, done){
	fetchFile(job.data.fileUrl, job.data.to).then(function cut( imageFile, fileName ){
		var dimensions = sizeOf( imageFile ),
			maxZoomLevel = getMaxZoomLevel( dimensions.width, dimensions.height),
			dir = tempName( 'TILES_', fileName ),
			firstMaxZoomLevel = Math.min(config.minZoom + 4, maxZoomLevel);

		console.log('Original size: ', dimensions.width, dimensions.height);
		console.log('Max zoom level', maxZoomLevel);

		jobs.create('cutTiles', {
			file: imageFile,
			dir: dir,
			minZoom: config.minZoom,
			maxZoom: firstMaxZoomLevel
		})
		.priority( 'high' )
		.save();

		for(var i = firstMaxZoomLevel+1; i <= maxZoomLevel; i++) {
			jobs.create('cutTiles', {
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

function process( fileUrl ) {
	jobs.create('fetchFile', {
		fileUrl: fileUrl,
		to: mapsDir
	})
	.priority('high')
	.save();
}

function getMaxZoomLevel( width, height ) {
	var size = Math.max( width, height );

	return Math.min( ~~Math.log( size, 2 ), config.maxZoom );
}

function generateTiles( imageFile, tempDir, minZoom, maxZoom ) {
	var deferred = Q.defer(),
		cmd = 'gdal2tiles.py -p raster -z ' +
			minZoom + '-' + maxZoom +
			' -w none ' +
			imageFile + ' ' + tempDir;

	console.log('Running:' + cmd);

	exec(cmd, function (error, stdout, stderr) {
		var dirs = [];

		console.log('stdout: ' + stdout);

		if (error !== null) {
			//callback( tempDir +  '/', error );
			deferred.reject(error);
			console.log('exec error: ' + error);
		} else {
			while ( minZoom <= maxZoom  ) {
				dirs.push(tempDir +  '/' + minZoom + '/');
				minZoom += 1;
			}

			deferred.resolve(dirs);
			console.log('Tiles generated into: ' + tempDir +  '/')
		}
	});

	return deferred;
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

function moveTiles( tempTilesDir, mapId ) {
	//add to queue
	var destinationDir = fs.realpathSync('./maps/tiles') + '/' + mapId;

	log(sprintf('Moving from "%s" to "%s"', tempTilesDir, destinationDir));

	return rename( tempTilesDir, destinationDir );
}

function optimizeTiles( dirs, done ) {
	var deferred = Q.defer();

	console.log('Optimizing tiles in folder: ' + dirs);
//	exec('imageOptim -d ' + dir, function(error, stdout, stderr){
//		console.log(stdout);
//		done();
//	})

	deferred.resolve();

	return deferred;
}

function uploadTiles( bucket, done ) {
	var deferred = Q.defer();
	//create bucket
	//upload images
	console.log('Uploading tiles for bucket:');
	deferred.resolve();

	return deferred;
}

function cleanup(dir, zoomLevel){
	var deferred = Q.defer();
	//remove local files
	console.log('Removing tiles in: ' + dir);

	deferred.resolve();

	return deferred;
}

kue.app.set('Interactive Maps', 'Wikia');
kue.app.listen(3000);

exports.process = process;
