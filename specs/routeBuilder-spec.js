'use strict';

var proxyquire = require('proxyquire' ),
	routeBuilder = proxyquire('./../lib/routeBuilder', {
		'./curdBuilder': function() {
			return {};
		}
	});

describe('Route Builder', function () {

	// mocks
	var router = {
			routes: [],
			route: function(path, handler) {
				this.routes.push({
					path: path,
					resource: handler
				});
			}
		},
		configs =  {
			test: {}
		},
		apiEntryPointUrl = '/api/';

	it('Creates a 2 routes for each CRUD collection', function () {
		routeBuilder(router, configs, apiEntryPointUrl);

		expect(router.routes.length).toEqual(2);
	});
	it('Creates correct route paths', function () {
		routeBuilder(router, configs, apiEntryPointUrl);

		expect(router.routes[0].path).toBe('/api/test');
		expect(router.routes[1].path).toBe('/api/test/:id');
	});
});
