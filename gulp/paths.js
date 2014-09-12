/*
 * Path list for tasks
 */

'use strict';

var path = require('path'),
	basePath = '.',
	dest = basePath + '/build';

module.exports = {
	assetsCBPath: {
		src: '/assets/',
		dest: '/assets/{{cacheBuster}}/'
	},
	base: basePath,
	baseFull: path.resolve(basePath),
	cacheBuster: dest + '/cachebuster.json',
	copyFiles: [
		basePath + '/api/**/*.*',
		'!' + basePath + '/api/v1/render.html', // it's handled by 'front' task
		basePath + '/assets/**/*.*',
		basePath + '/lib/*.*',
		basePath + '/specs/*.*',
		basePath + '/tools/*.*',
		basePath + '/server/*.*'
	],
	dest: dest,
	destFull: path.resolve(dest),
	front: basePath + '/api/v1/render.html',
	ignoreScriptFiles: '!' + basePath + '/assets/**/*.js', // scripts from assets are handled by 'front' task
	lib: 'lib/*.js',
	locales: dest + '/locales/translations.json',
	nodeModules: {
		src: basePath + '/node_modules',
		dest: dest + '/node_modules'
	},
	nodemon: {
		script: dest + '/server/app.js'
	},
	specs: 'specs/**',
	watch: {
		assets: [
			basePath + '/assets/**/*.*'
		],
		copyFiles: [
			basePath + '/api/**/*.*',
			basePath + '/lib/*.js',
			basePath + '/server/*.js'
		],
		nodeModules: [
			basePath + '/package.json'
		]
	}
};
