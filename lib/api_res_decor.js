'use strict';

var host = require('os').hostname(),
	port = require('./config').api.port;


/**
 * @desc extend objects with URL for API entry points
 * @param data {array|object} - array of objects or single object that will be sent to API client
 * @param schema {object} - schema with rules for decorating objects
 * @param baseUrl {string} - base API entry point URL
 * @returns {array} - array of extended objects
 */

function decorate(data, schema, baseUrl) {
	var collection = standardizeInput(data),
		length = collection.length,
		absoluteUrl = 'http://' + host + ':' + port + baseUrl,
		returnCollection = [];

	if (length && schema) {
		collection.forEach(function(value) {
			returnCollection.push(extendObjectProps(value, schema, absoluteUrl));
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
 * @param absoluteUrl {string} - absolute API url
 * @returns {object} - extended input objects
 */

function extendObjectProps(obj, schema, absoluteUrl) {
	Object.keys(schema).forEach(function(value) {
		obj[schema[value].paramName] = absoluteUrl + schema[value].apiMethod + '/' + obj[value];
	});

	return obj;
}

// Public API

module.exports = decorate;
