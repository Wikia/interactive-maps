'use strict';

var jsv = require('JSV').JSV,
	env = jsv.createEnvironment();

/**
 * @desc validate JSON
 * @param json {object} - parsed request body
 * @param schema {object} - json schema used for validation
 * @returns {array} - array of error objects
 */

function validateJSON(json, schema) {
	var report = {
		errors: []
	};

	if (typeof json !== 'object' || Object.keys(json).length === 0) {
		report.errors.push({
			massage: 'Incorrect JSON format!',
			json: json
		});
	} else {
		// validate against schema
		report = env.validate(json, schema);
	}

	return report.errors;
}

module.exports = validateJSON;
