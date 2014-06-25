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
	config = require('./lib/config'),
	port = config.api.port,
	app = express(),
	router = detour(),

	// Interactive Maps API Version 1
	apiPath = '/api/v1/',
	apiAbsolutePath = __dirname + apiPath,
	crudModules = getCRUDs.requireCruds(getCRUDs.getCruds(apiAbsolutePath)),
	// express divides passed maxAge by 1000
	staticMaxAge = cachingUtils.cacheShort * 1000;

//build routes for Version 1
routeBuilder(router, crudModules, apiPath);

app.use(guard);
app.use(logger.middleware);
app.use(rawBody);
app.use(cachingUtils.middleware);
app.use(router.middleware);
renderMap(app, apiPath, apiAbsolutePath);
heartBeatHandler(app);

// assets' cachebusting
app.use( '/' + config.getCachebuster() + '/', express.static(__dirname + '/assets', {maxAge: staticMaxAge}));
// for assets required in leaflet-wikia.css
app.use( express.static(__dirname + '/assets', {maxAge: staticMaxAge}));

app.use(errorHandler.middleware);

app.listen(port);
logger.notice('Server started on port: ' + port);
