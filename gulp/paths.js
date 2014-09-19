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
	cacheBuster: {
		file: dest + '/server/cachebuster.json',
		assetsPath: {
			src: '/assets/',
			dest: '/assets/{{cacheBuster}}/'
		}
	},
	copyFiles: [
		basePath + '/api/**/*.*',
		'!' + basePath + '/api/v1/render.html', // it's handled by 'front' task
		basePath + '/assets/**/*.*',
		basePath + '/frontend_tests/**/*.*',
		basePath + '/lib/*.*',
		basePath + '/specs/*.*',
		basePath + '/tools/*.*',
		basePath + '/server/*.*'
	],
	dest: dest,
	destFull: path.resolve(dest),
	front: basePath + '/api/v1/render.html',
	ignoreScriptFiles: '!' + basePath + '/assets/**/*.js', // scripts from assets are handled by 'front' task
	lib: dest + '/lib/*.js',
	locales: {
		dest: dest + '/locales/translations.json',
		// temporary solution, to be changed when new Messages Service is introduced
		src: 'http://maps.wikia.com/wikia.php?controller=WikiaInteractiveMaps&method=translation'
	},
	nodeModules: {
		src: basePath + '/node_modules',
		dest: dest + '/node_modules'
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
	},
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
