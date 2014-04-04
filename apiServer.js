'use strict';

// third party modules
var express = require('express'),
	detour = require('detour'),
	hoganExpress = require('hogan-express'),

	// local modules
	rawBody = require('./lib/rawBody'),
	getCurdConfigs = require('./lib/getCurdConfigs'),
	routeBuilder = require('./lib/routeBuilder'),
	renderMap = require('./lib/renderMap'),

	port = require('./lib/config').api.port,

	app = express(),
	router = detour(),

	// Interactive Maps API Version 1
	configsV1 = getCurdConfigs('/api/v1/'),
	apiEntryPointUrlV1 = '/api/v1/';

// build routes for Version 1
routeBuilder(router, configsV1, apiEntryPointUrlV1);

app.use(express.logger());
app.use(rawBody);
app.use(router.middleware);

// setup hogan as template engine
app.set('view engine', 'html');
app.enable('view cache');
app.engine('html', hoganExpress);

app.get(apiEntryPointUrlV1 + 'render/:id/:lat/:lon/:zoom', renderMap.middleware);

// FIXME: Probably we won't serve the assets the API server, but this can be used for debugging right now
app.use(express.static(__dirname + '/assets'));

app.listen(port);
console.log('server is listening on port: ' + port);
