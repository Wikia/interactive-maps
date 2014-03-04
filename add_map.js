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

var sys = require('sys'),
	os = require('os'),
	exec = require('child_process').exec,
	fs = require('fs'),
	path = require('path'),
	mysql = require('mysql'),
	sizeOf = require('image-size'),
	fetchFile = require('./fetchImage'),
	dfs = require('./dfs'),
	kue = require('kue'),
	jobs = kue.createQueue(),
	MIN_ZOOM = 0,
	MAX_ZOOM = 2;

//TODO: Move to config
var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : ''
});

var tmpDir = os.tmpdir() + 'int_map/',
	mapsDir = tmpDir + 'maps/',
	tilesDir = tmpDir + 'tiles/';

//setup folders
if ( !fs.existsSync( tmpDir ) ) {
	fs.mkdirSync( tmpDir );
}

if ( !fs.existsSync( mapsDir ) ) {
	fs.mkdirSync( mapsDir );
}

if ( !fs.existsSync( tilesDir ) ) {
	fs.mkdirSync( tilesDir );
}

jobs.process('sendTiles', function(){

});

jobs.process('cutTiles', function(job, done){
	var file = job.data.file,
		fileName = job.data.fileName,
		minZoom = job.data.minZoom,
		maxZoom = job.data.maxZoom;

	generateTiles( file, fileName, minZoom, maxZoom, done );

//	insertMap({
//		name: 'Map from ' +  originalImageName,
//		min_zoom: MIN_ZOOM,
//		max_zoom: maxZoomLevel,
//		width: dimensions.width,
//		height: dimensions.height
//	});
});

jobs.process('fetchFile', function(job, done){
	fetchFile(job.data.fileUrl, job.data.to, function cut( imageFile ,fileName ){
		var originalImageName = path.basename( imageFile ),
			dimensions = sizeOf( imageFile );

		console.log('Original size: ', dimensions.width, dimensions.height);

		var maxZoomLevel = 9;//getMaxZoomLevel( dimensions.width, dimensions.height, MAX_ZOOM );

		console.log('Max zoom level', maxZoomLevel);

		jobs.create('cutTiles', {
			file: imageFile,
			fileName: fileName,
			minZoom: 0,
			maxZoom: 0
		}).priority('high').save();

		for(var i = 1; i <= maxZoomLevel; i++) {
			jobs.create('cutTiles', {
				file: imageFile,
				fileName: fileName,
				minZoom: i,
				maxZoom: i
			}).priority('low').save();
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

function getMaxZoomLevel( width, height, max ) {
	var size = Math.max( width, height );
	max = max || 14;

	return Math.min( ~~Math.log( size, 2 ), max );
}

function generateTiles( imageFile, fileName, minZoomLevel, maxZoomLevel, done ) {
	var tempDir = tempname( 'TILES_', fileName ),
		cmd = 'gdal2tiles.py -p raster -z ' +
			minZoomLevel +
			'-' +
			maxZoomLevel +
			' -w none ' +
			imageFile +
			' ' +
			tempDir;

	console.log(cmd);

	exec(cmd, function (error, stdout, stderr) {
		console.log('stdout: ' + stdout);
		console.log('stderr: ' + stderr);

		done();

		if (error !== null) {
			console.log('exec error: ' + error);
		}
	});

	return tempDir;
}

function tempname( prefix, fileName ){
	return mapsDir + prefix + fileName + '_' + (+new Date()) ;
}

function insertMap( mapData ) {
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

function cleanup(dir, zoomLevel){
	//remove tiles
}

kue.app.set('Interactive Maps', 'Wikia');
kue.app.listen(3000);

exports.process = process;
