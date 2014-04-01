'use strict';

var curdBuilder = require('./curdBuilder');

/**
 * @desc set all API routes
 * @param router {object} - detour router object
 * @param configs {object} - object containing all configs object
 * @param apiEntryPointUrl {string} - url for API entry point
 */

function routeBuilder(router, configs, apiEntryPointUrl) {
	Object.keys(configs).forEach(function(key) {
		setRoute(router, key, configs[key], apiEntryPointUrl);
	});
}

// Private functions

/**
 * @desc set single API route
 * @param router {object} - detour router object
 * @param apiMethod {string} - API method name
 * @param config {object} - configuration object
 * @param apiEntryPointUrl {string} - url for API entry point
 */

function setRoute(router, apiMethod, config, apiEntryPointUrl) {
	var route = apiEntryPointUrl + apiMethod,
		curd = curdBuilder(config, apiEntryPointUrl);

	router.route(route, curd.handler);
	router.route(route + '/:id', curd.wildcard);
}

// Public API

module.exports = routeBuilder;
