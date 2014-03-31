'use strict';

var config = require('./lib/config'),
	kue = require('kue');

// create kue server
kue.app.set('title', config.kue.title);
kue.app.listen(config.kue.port);

console.log('Kue is listening on port', config.kue.port);
