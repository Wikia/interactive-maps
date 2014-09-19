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
			'NODE_ENV': 'devbox',
			// karma-phantomjs-launcher tries to run phantomjs.exe if this is not set
			'PHANTOMJS_BIN': paths.baseFull + '/node_modules/phantomjs/lib/phantom/bin/phantomjs'
		}),
		path: paths.server.script,
		successMessage: /Server started/
	},
	srcBase: {
		base: './'
	}
};
