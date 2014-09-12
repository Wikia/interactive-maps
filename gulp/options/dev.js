/*
 * Options for dev environment
 */
'use strict';

var paths = require('../paths'),
	extend = require('util')._extend;

module.exports = {
	server: {
		delay: 0,
		env: extend(process.env, {
			'NODE_ENV': 'devbox'
		}),
		path: paths.server.script,
		successMessage: /Server started/
	},
	srcBase: {
		base: './'
	}
};
