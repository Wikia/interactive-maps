'use strict';

// third party modules
var express = require('express'),
	detour = require('detour'),

	// local modules
	rawBody = require('./lib/rawBody'),
	getCurdConfigs = require('./lib/getCurdConfigs'),
	routeBuilder = require('./lib/routeBuilder'),
	logger = require('./lib/logger'),
	guard = require('./lib/guard'),
	errorHandler = require('./lib/errorHandler'),

	port = require('./lib/config').api.port,

	app = express(),
	router = detour(),

	// Interactive Maps API Version 1
	configsV1 = getCurdConfigs('/api/v1/'),
	apiEntryPointUrlV1 = '/api/v1/';

//build routes for Version 1
routeBuilder(router, configsV1, apiEntryPointUrlV1);

app.use(guard);
app.use(express.logger());
app.use(rawBody);
app.use(router.middleware);
app.use(errorHandler);

app.listen(port);
logger.info('server is listening on port: ' + port);
