/*
 * Path list for tasks
 */

'use strict';

var path = require('path'),
	basePath = '.',
	dest = basePath + '/build';

module.exports = {
	base: basePath,
	baseFull: path.resolve(basePath),
	buildDynamic: [
		basePath + '/api/v1/render.html',
		basePath + '/assets/**/*.js'
	],
	buildStatic: [
		basePath + '/api/**/*.*',
		basePath + '/assets/**/*.*',
		'!' + basePath + '/api/v1/render.html',
		'!' + basePath + '/assets/**/*.js',
		basePath + '/frontend_tests/**/*.*',
		basePath + '/lib/*.*',
		basePath + '/specs/*.*',
		basePath + '/tools/*.*',
		basePath + '/server/*.*'
	],
	cacheBuster: {
		file: dest + '/cachebuster.json',
		assetsPath: {
			src: '/assets/',
			dest: '/assets/{{cacheBuster}}/'
		}
	},
	dest: dest,
	destFull: path.resolve(dest),
	lib: dest + '/lib/*.js',
	api: dest + '/api/**/*.js',
	locales: {
		dest: dest + '/locales/translations.json',
		// temporary solution, to be changed when new Messages Service is introduced
		src: 'http://maps.wikia.com/wikia.php?controller=WikiaInteractiveMaps&method=translation'
	},
	nodeModules: {
		src: basePath + '/node_modules',
		dest: dest + '/node_modules',
		list: basePath + '/package.json'
	},
	server: {
		script: dest + '/server/app.js'
	},
	tests: {
		back: dest + '/specs/**',
		front: {
			config: dest + '/frontend_tests/karma.conf.js',
			files: [
				dest + '/frontend_tests/define.mock.js',
				dest + '/assets/scripts/im.*.js',
				dest + '/frontend_tests/specs/*-spec.js'
			]
		}
	}
};
