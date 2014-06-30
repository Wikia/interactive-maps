'use strict';

/**
 * Use this script to deploy the placeholder image for geo map
 */

var dfs = require('../lib/dfs'),
	utils = require('../lib/utils'),
	config = require('../lib/config'),
	mapName = 'Geo Map',
	dataDir = __dirname + '/../assets/images/',
	fileName = 'default-geo.jpg',
	bucketName = utils.getBucketName(config.bucketPrefix, mapName);

console.log('Upload ' + dataDir + fileName + ' to bucket ' + bucketName);

dfs.sendFiles(bucketName, dataDir, fileName)
.then(function (result) {
	console.log(result);
})
.catch(function (error) {
	console.log(error);
});
