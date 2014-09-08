/*
 * Options for dev environment
 */
'use strict';

var paths = require('../paths');

module.exports = {
	nodemon: {
		script: paths.nodemon.script,
		ext: 'js',
		ignore: paths.nodemon.ignore,
		env: {
			'NODE_ENV': 'devbox'
		}
	},
	srcBase: {
		base: './'
	}
};
