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
	//kue = require('kue'),
	//jobs = kue.createQueue(),
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

function process( fileUrl, outputDir ) {
	fetchFile(fileUrl, mapsDir, function(imageFile ,fileName ){
		var originalImageName = path.basename( imageFile ),
			dimensions = sizeOf( imageFile );

		console.log('Original size: ', dimensions.width, dimensions.height);

		var maxZoomLevel = getMaxZoomLevel( dimensions.width, dimensions.height, MAX_ZOOM );

		console.log('Max zoom level', maxZoomLevel);

		var tempTilesDir = generateTiles( imageFile, fileName, MIN_ZOOM, maxZoomLevel),
			mapId = insertMap({
				name: 'Map from ' +  originalImageName,
				min_zoom: MIN_ZOOM,
				max_zoom: maxZoomLevel,
				width: dimensions.width,
				height: dimensions.height
			});

		return 'done';
		//return moveTiles( tempTilesDir, mapId );
	})
}

function getMaxZoomLevel( width, height, max ) {
	var size = Math.max( width, height );
	max = max || 14;

	return Math.min( ~~Math.log( size, 2 ), max );
}

function generateTiles( imageFile, fileName, minZoomLevel, maxZoomLevel ) {
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

exports.process = process;
