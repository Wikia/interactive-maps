'use strict';

// third party modules
var express = require('express'),
	detour = require('detour'),

	// local modules
	rawBody = require('./lib/rawBody'),
	getCurdConfigs = require('./lib/getCurdConfigs'),
	routeBuilder = require('./lib/routeBuilder'),
	renderMap = require('./lib/renderMap'),

	port = require('./lib/config').api.port,

	app = express(),
	router = detour(),

	// Interactive Maps API Version 1
	apiConfigUrl = '/api/v1/',
	configsV1 = getCurdConfigs(apiConfigUrl),
	apiEntryPointUrlV1 = '/api/v1/',
	apiAbsolutePath = __dirname + apiConfigUrl;

// build routes for Version 1
routeBuilder(router, configsV1, apiEntryPointUrlV1);

app.use(express.logger());
app.use(rawBody);
app.use(router.middleware);

renderMap(app, apiEntryPointUrlV1, apiAbsolutePath);

// FIXME: Probably we won't serve the assets the API server, but this can be used for debugging right now
app.use(express.static(__dirname + '/assets'));

app.listen(port);
console.log('server is listening on port: ' + port);
