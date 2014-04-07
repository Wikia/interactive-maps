'use strict';

var logger = require('./lib/logger');
//set up the logger with console transport
logger.set({console: {enabled: true, level: logger.level.DEBUG, raw: true}});

// third party modules
var express = require('express'),
	detour = require('detour'),

	// local modules
	rawBody = require('./lib/rawBody'),
	getCurdConfigs = require('./lib/getCurdConfigs'),
	routeBuilder = require('./lib/routeBuilder'),

	port = require('./lib/config').api.port,

	app = express(),
	router = detour(),

	// Interactive Maps API Version 1
	configsV1 = getCurdConfigs('/api/v1/'),
	apiEntryPointUrlV1 = '/api/v1/';

//build routes for Version 1
routeBuilder(router, configsV1, apiEntryPointUrlV1);
app.use(logger.middleware);
app.use(rawBody);
app.use(router.middleware);

app.listen(port);
logger.info('server is listening on port: ' + port);
