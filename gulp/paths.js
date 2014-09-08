/*
 * Path list for tasks
 */

'use strict';

var path = require('path'),
	basePath = '.',
	dest = basePath + '/build/';

module.exports = {
	base: basePath,
	baseFull: path.resolve(basePath),
	cacheBuster: dest + 'cachebuster.json',
	copyFiles: [
		'./api/**/*.*',
		'!./api/v1/render.html',
		'./assets/**/*.*',
		'./lib/*.*',
		'./locales/*.*',
		'./specs/*.*',
		'./tools/*.*',
		'./apiServer.js',
		'./app.js',
		'./gulpfiles.js',
		'./kueServer.js',
		'./newrelic.js'
	],
	dest: dest,
	front: './api/v1/render.html',
	ignoreScriptFiles: '!./assets/**/*.js',
	locales: basePath + '/locales/translations.json',
	nodeModules: {
		src: 'node_modules',
		dest: dest + 'node_modules'
	},
	specs: 'specs/**',
	lib: 'lib/*.js'
};
