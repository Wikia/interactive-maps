/*
 * Path list for tasks
 */

'use strict';

var path = require('path'),
	basePath = '.',
	dest = basePath + '/build/';

module.exports = {
	assetsCBPath: {
		src: '/assets/',
		dest: '/assets/{{cacheBuster}}/'
	},
	base: basePath,
	baseFull: path.resolve(basePath),
	cacheBuster: dest + 'cachebuster.json',
	copyFiles: [
		basePath + '/api/**/*.*',
		'!' + basePath + '/api/v1/render.html',
		basePath + '/assets/**/*.*',
		basePath + '/lib/*.*',
		basePath + '/locales/*.*',
		basePath + '/specs/*.*',
		basePath + '/tools/*.*',
		basePath + '/apiServer.js',
		basePath + '/app.js',
		basePath + '/gulpfiles.js',
		basePath + '/kueServer.js',
		basePath + '/newrelic.js'
	],
	dest: dest,
	front: basePath + '/api/v1/render.html',
	ignoreScriptFiles: '!' + basePath + '/assets/**/*.js',
	lib: 'lib/*.js',
	locales: basePath + '/locales/translations.json',
	nodeModules: {
		src: 'node_modules',
		dest: dest + 'node_modules'
	},
	nodemon: {
		script: dest + 'app.js'
	},
	specs: 'specs/**',
	watch: [
		basePath + '/api/**/*.js',
		basePath + '/lib/*.js'
	]
};
