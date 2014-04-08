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

	if (typeof json !== 'object'  || json === null || Object.keys(json).length === 0) {
		report.errors.push({
			message: 'Incorrect JSON format!',
			json: json
		});
	} else {
		// validate against schema
		report = env.validate(json, schema);
	}

	return report.errors;
}

module.exports = validateJSON;
