#!/usr/bin/env node
'use strict';

var config = require('../lib/config'),
	jobs = require('kue').createQueue(config),
	checkInterval = 5000,
	value;

function count() {
	jobs.inactiveCount(function (err, val) {
		if (err) {
			value = 'ERROR';
		} else {
			value = val;
		}
		console.log(new Date().toISOString() + '\t' + value);
	});
}

setInterval(count, checkInterval);
