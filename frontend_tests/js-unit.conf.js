'use strict';

var base = require('./karma.conf.js');

module.exports = function(config) {
	base(config);

	config.set({
		files: [
			// mock modil.js define
			'frontend_tests/define.mock.js',

			// files to be tested
			'assets/scripts/im.*.js',

			// spec files
			'frontend_tests/specs/*-spec.js'
		]
	});
};
