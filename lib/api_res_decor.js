/**
 * @desc extend objects with URL for API entry points
 * @param data {array|object} - array of objects or single object that will be sent to API client
 * @param config {object} - curd collection cofing
 * @param baseUrl {string} - base API entry point URL
 * @returns {array} - array of extended objects
 */

function process(data, config, baseUrl) {
	var schema = config.responseSchema,
		collection = standardizeInput(data),
		length = collection.length,
		returnCollection = [];

	if (length && schema) {
		collection.forEach(function(value) {
			returnCollection.push(decorate(value, schema, baseUrl));
		})
	}

	return returnCollection;
}

// Private functions

/**
 * @desc Standardize input so it's always array to be processed
 * @param data {array|object} - array with collection of object or single object
 * @returns {Array}
 */

function standardizeInput(data) {
	var collection = [];

	if (Array.isArray(data)) {
		collection = data;
	} else {
		collection.push(data)
	}

	return collection;
}

/**
 * @desc Extend object with api URLs based on schema
 * @param obj {object} - data object
 * @param schema {object} - schema for extending object with api URLs
 * @param baseUrl {string} - base API url
 * @returns {object} - extended input objects
 */

function decorate(obj, schema, baseUrl) {
	var p;

	for (p in schema) {
		if (obj.hasOwnProperty(p)) {
			obj[schema[p].paramName] = baseUrl + schema[p].entryPoint + obj[p];
		}
	}
	return obj;
}

// Public API

module.exports = process;
