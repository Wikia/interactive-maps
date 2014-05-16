'use strict';

var proxyquire = require('proxyquire').noCallThru(),
	stubs = require('./stubs');

describe('jobProcessors', function () {
	it('should process jobs', function () {
		proxyquire('../lib/jobProcessors', {
			'./config': {
				kue: {
					maxFetchJobs: 99,
					maxCutTilesJobs: 99,
					maxProcessMarkerJobs: 99
				}
			},
			'kue': {
				createQueue: function () {
					return {
						process: function (name, maxJobs, runner) {
							expect(name).toMatch(/process|tiling/);
							expect(maxJobs).toBe(99);
							expect(typeof runner).toBe('function');
						}
					};
				}
			},
			'./db_connector': {},
			'./utils': {},
			'image-size': {},
			'./fetchImage': {},
			'./generateTiles': {},
			'./logger': {},
			'./cleanupTiles': {},
			'./uploadTiles': {},
			'./optimizeTiles': {}
		});
	});
});
