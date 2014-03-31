'use strict';

/**
 * @desc Public function for validating CURD config
 * @param config config {object} - CURD configuration object
 */

function validateCurdConfig(config) {
	validateConfig(config);
	validateSchemas(config);
}

// Private functions

/**
 * @desc Validates config type and required params
 * @param config {object} - CURD configuration object
 */

function validateConfig(config) {
	// validate type of config
	if (typeof config !== 'object') {
		throw new Error('Config must be an object!');
	}

	// check if required config properties exist
	if (!config.hasOwnProperty('dbTable') || !config.hasOwnProperty('dbColumns')) {
		throw new Error('Config properties "dbTable" and "dbColumns" are required!');
	}
}

/**
 * @desc Validates create and update schema
 * @param config {object} - CURD configuration object
 */

function validateSchemas(config) {
	var blockedMethods = config.blockedMethods || {},
		handler = blockedMethods.handler || {},
		wildcard = blockedMethods.wildcard || {};

	if (handler.POST !== false && !config.createSchema) {
		throw new Error('Schema for validating object creation is required!');
	}
	if (wildcard.PUT !== false && !config.updateSchema) {
		throw new Error('Schema for validating object updating is required!');
	}
}

module.exports = validateCurdConfig;
