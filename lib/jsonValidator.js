'use strict';

var jsv = require('JSV').JSV,
	env = jsv.createEnvironment(),
	urlPattern = '^(http[s]?:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_+~#=]+)+' +
		'((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?';


module.exports = {
	/**
	 * @desc validate JSON
	 * @param json {object} - parsed request body
	 * @param schema {object} - json schema used for validation
	 * @returns {array} - array of error objects
	 */

	validateJSON: function (json, schema) {
		var report = {
			errors: []
		};

		if (typeof json !== 'object' || json === null || Object.keys(json).length === 0) {
			report.errors.push('Incorrect JSON format');
		} else {
			// validate against schema
			report = env.validate(json, schema);
		}

		return report.errors;
	},

	getUrlPattern: function () {
		return urlPattern;
	}
};
