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
		src: 'http://maps.wikia.com/wikia.php?controller=WikiaMapsSpecial&method=translation'
	},
	nodeModules: {
		src: basePath + '/node_modules',
		dest: dest + '/node_modules',
		list: basePath + '/package.json'
	},
	server: {
		script: dest + '/server/app.js'
	},
	tests: function (noBuild) {
		var prefix = noBuild ? basePath : dest;

		return {
			back: prefix + '/specs/**',
			front: {
				config: prefix + '/frontend_tests/karma.conf.js',
				files: [
					prefix + '/frontend_tests/define.mock.js',
					prefix + '/assets/scripts/im.*.js',
					prefix + '/frontend_tests/specs/*-spec.js'
				]
			}
		};
	}
};
