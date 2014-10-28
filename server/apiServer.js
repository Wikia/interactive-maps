'use strict';

// third party modules
var express = require('express'),
	detour = require('detour'),
	responseTime = require('response-time'),

	// express middleware
	guard = require('../lib/guard'),
	logger = require('../lib/logger'),
	rawBody = require('../lib/rawBody'),
	errorHandler = require('../lib/errorHandler'),
	heartBeatHandler = require('../lib/healthCheck').heartBeatHandler,
	cachingUtils = require('../lib/cachingUtils'),

	// API entry points modules
	getCRUDs = require('../lib/getCRUDs'),
	routeBuilder = require('../lib/routeBuilder'),
	renderMap = require('../lib/renderMap'),

	// other local variables
	config = require('../lib/config'),
	port = config.api.port,
	app = express(),
	router = detour(),

	// Interactive Maps API Version 1
	apiPath = '/api/v1/',
	apiAbsolutePath = config.root + apiPath,
	crudModules = getCRUDs.requireCruds(getCRUDs.getCruds(apiAbsolutePath)),
	// express divides passed maxAge by 1000
	staticMaxAge = cachingUtils.cacheShort * 1000;

//build routes for Version 1
routeBuilder(router, crudModules, apiPath);

// enable CORS for all requests (possiblty apiAbsolutePath could be used insteaf of *)
app.all('*', function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'X-Requested-With');
	next();
});
app.use(responseTime({
	digits: 0,
	header: 'X-Backend-Response-Time'
}));
app.use(guard);
app.use(logger.middleware);
app.use(rawBody);
// add default HTTP request headers
app.use(cachingUtils.middleware);
app.use(router.middleware);
renderMap(app, apiPath, apiAbsolutePath);
heartBeatHandler(app);
// assets' cachebusting
app.use('/assets', cachingUtils.filterCachebuster);
app.use('/assets', express.static(config.root + '/assets', {maxAge: staticMaxAge}));
// for assets required in leaflet-wikia.css
app.use(express.static(config.root + '/assets', {maxAge: staticMaxAge}));

app.use(errorHandler.middleware);

// remove expressjs header
app.disable('x-powered-by');

// the 404 Route (ALWAYS Keep this as the last route)
app.use(errorHandler.serveNotFoundError);

app.listen(port);
logger.notice('Server started on port: ' + port);
