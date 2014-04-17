'use strict';

describe('Route Builder', function () {

	// mocks
	var routeBuilder = require('./../lib/routeBuilder'),
		router = {
			routes: [],
			route: function(path, handler) {
				this.routes.push({
					path: path,
					resource: handler
				});
			}
		},
		crudModules =  {
			test: function() {
				return {};
			}
		},
		apiEntryPointUrl = '/api/';

	it('Creates a 2 routes for each CRUD collection', function () {
		routeBuilder(router, crudModules, apiEntryPointUrl);

		expect(router.routes.length).toEqual(2);

		router.routes = [];
	});
	it('Creates correct route paths', function () {
		routeBuilder(router, crudModules, apiEntryPointUrl);

		expect(router.routes[0].path).toBe('/api/test');
		expect(router.routes[1].path).toBe('/api/test/:id');

		router.routes = [];
	});

	it('Creates routes for multiple CRUD modules', function() {
		crudModules = {
			test: function() {
				return {};
			},
			test2: function() {
				return {};
			},
			test3: function() {
				return {};
			}
		};

		routeBuilder(router, crudModules, apiEntryPointUrl);

		expect(router.routes.length).toEqual(6);

		router.routes = [];
	});
});
