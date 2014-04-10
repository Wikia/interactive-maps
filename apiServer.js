'use strict';

// third party modules
var express = require('express'),
	detour = require('detour'),

	// local modules
	rawBody = require('./lib/rawBody'),
	crudConfigs = require('./lib/getCurdConfigs'),
	routeBuilder = require('./lib/routeBuilder'),
	logger = require('./lib/logger'),
	renderMap = require('./lib/renderMap'),
	guard = require('./lib/guard'),
	errorHandler = require('./lib/errorHandler'),

	port = require('./lib/config').api.port,

	app = express(),
	router = detour(),

	// Interactive Maps API Version 1
	apiConfigUrl = '/api/v1/',
	apiEntryPointUrlV1 = '/api/v1/',
	apiAbsolutePath = __dirname + apiConfigUrl,
	configsV1 = crudConfigs.requireConfigs(crudConfigs.getConfigs(apiAbsolutePath));

console.log(__dirname);

//set up the logger with console transport
logger.set({
	console: {
		enabled: true,
		level: logger.level.DEBUG,
		raw: true
	}
});

//build routes for Version 1
routeBuilder(router, configsV1, apiEntryPointUrlV1);

app.use(guard);
app.use(logger.middleware);
app.use(rawBody);
app.use(router.middleware);
renderMap(app, apiEntryPointUrlV1, apiAbsolutePath);
app.use(errorHandler);

// FIXME: Probably we won't serve the assets the API server, but this can be used for debugging right now
app.use(express.static(__dirname + '/assets'));

app.listen(port);
logger.info('server is listening on port: ' + port);
