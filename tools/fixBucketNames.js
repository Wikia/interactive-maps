'use strict';

var utils = require('../lib/utils'),
	dbCon = require('../lib/db_connector'),
	dfs = require('../lib/dfs'),
	logger = require('../lib/logger'),
	exec = require('child_process').exec,
	conversionList = [];
	//bucketName = utils.getBucketName(config.bucketPrefix, mapName);

function getOldBucketName(bucketPrefix, mapName) {
	return encodeURIComponent(bucketPrefix + mapName.trim().replace(/[ \/]/g, '_'));
}

//set up the logger with console transport
logger.set({
	console: {
		enabled: true,
		level: logger.level.DEBUG,
		raw: true
	},
	file: {
		enabled: true,
		level: logger.level.DEBUG,
		raw: true,
		path: 'intMaps.log'
	},
	syslog: {
		enabled: true,
		level: logger.level.DEBUG,
		tag: 'intMaps',
		dev: true
	}
});

dbCon
	.select('tile_set', ['id', 'name'])
	.then(function (collection) {
		//collection = [collection[1]]; //temporary

		collection.forEach(function (item) {
			var conversionData = {};
			conversionData.oldBucketName = getOldBucketName('intmap_', item.name);
			conversionData.newBucketName = utils.getBucketName(
				'intmap_tile_set_',
				item.id
			);

			conversionList.push(conversionData);
		});

		conversionList.forEach(function (item) {
			dfs
				.createBucket(item.newBucketName)
				.then(function () {
					exec(
						'python ' +
						process.argv[2] + ' ' + //customized s3cmd path
						'-c ' +
						process.argv[3] + ' ' + //s3 config path
						'cp --recursive --exclude=* --include=* s3://' + item.oldBucketName +
						'/ s3://' + item.newBucketName + '/',
						function (error, stdout, stderr) {
							console.log('stdout: ' + stdout);
							console.log('stderr: ' + stderr);
							if (error !== null) {
								console.log('exec error: ' + error);
							}
						}
					);
				});
		});
	});
