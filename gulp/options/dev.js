/*
 * Options for dev environment
 */
'use strict';

var paths = require('../paths');

module.exports = {
	nodemon: {
		script: paths.nodemon.script,
		env: {
			'NODE_ENV': 'devbox'
		},
		// this is workaround, see https://github.com/JacksonGariety/gulp-nodemon/issues/20
		ext: '__non_existing_extension__',
		watch: '__non_existing_path__'
	},
	srcBase: {
		base: './'
	}
};
