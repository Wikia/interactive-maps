'use strict';

/**
 * @desc set all API routes
 * @param router {object} - detour router object
 * @param crudModules {object} - object containing all CRUD collection modules
 * @param apiEntryPointUrl {string} - url for API entry point
 */

function routeBuilder(router, crudModules, apiEntryPointUrl) {
	Object.keys(crudModules).forEach(function(key) {
		setRoute(router, key, crudModules[key], apiEntryPointUrl);
	});
}

// Private functions

/**
 * @desc set single API route
 * @param router {object} - detour router object
 * @param apiMethod {string} - API method name
 * @param crudModule {function} - CRUD collection module
 * @param apiEntryPointUrl {string} - url for API entry point
 */

function setRoute(router, apiMethod, crudModule, apiEntryPointUrl) {
	var route = apiEntryPointUrl + apiMethod,
		curd = crudModule();

	router.route(route, curd.handler);
	router.route(route + '/:id', curd.wildcard);
}

// Public API

module.exports = routeBuilder;
