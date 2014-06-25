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
	cachingUtils = require('./lib/cachingUtils'),

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

//build routes for Version 1
routeBuilder(router, crudModules, apiPath);

app.use(guard);
app.use(logger.middleware);
app.use(rawBody);
app.use(cachingUtils.middleware);
app.use(router.middleware);
renderMap(app, apiPath, apiAbsolutePath);
heartBeatHandler(app);

// assets cachebusting
app.use('/assets', cachingUtils.filterCachebuster);
app.use('/assets', express.static(__dirname + '/assets', {maxAge: 300 * 1000}));

app.use(errorHandler.middleware);

app.listen(port);
logger.notice('Server started on port: ' + port);
