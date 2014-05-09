'use strict';

// third party modules
var express = require('express'),
	detour = require('detour'),

	// express middleware
	guard = require('./lib/guard'),
	logger = require('./lib/logger'),
	rawBody = require('./lib/rawBody'),
	errorHandler = require('./lib/errorHandler'),
	heartBeatHandler = require('./lib/healthCheck').heartBeatHandler,

	// API entry points modules
	getCRUDs = require('./lib/getCRUDs'),
	routeBuilder = require('./lib/routeBuilder'),
	renderMap = require('./lib/renderMap'),

	// other local variables
	port = require('./lib/config').api.port,
	app = express(),
	router = detour(),

	// Interactive Maps API Version 1
	apiPath = '/api/v1/',
	apiAbsolutePath = __dirname + apiPath,
	crudModules = getCRUDs.requireCruds(getCRUDs.getCruds(apiAbsolutePath));

//set up the logger with console transport
logger.set({
	console: {
		enabled: true,
		level: logger.level.DEBUG,
		raw: true
	}
});

//build routes for Version 1
routeBuilder(router, crudModules, apiPath);

app.use(guard);
app.use(logger.middleware);
app.use(rawBody);
app.use(router.middleware);
renderMap(app, apiPath, apiAbsolutePath);
heartBeatHandler(app);

// FIXME: Probably we won't serve the assets the API server, but this can be used for debugging right now
app.use(express.static(__dirname + '/assets'));

app.use(errorHandler.middleware);

app.listen(port);
logger.notice('Server started on port: ' + port);
