'use strict';

var proxyquire = require('proxyquire').noCallThru(),
	stubs = require('./stubs');

describe('Generate tiles', function () {
	var qStub = stubs.newQStub(),
		collector = stubs.newCollector(['script', 'args']),
		childProcessStub = {
			spawn: function (script, args) {
				collector.script(script);
				collector.args(args);
				return {
					stdout: {
						on: function () {}
					},
					on: function () {}
				};
			}
		},
		loggerInfo = jasmine.createSpy('loggerInfo'),
		generateTiles = proxyquire('../lib/generateTiles', {
			q: qStub.q,
			child_process: childProcessStub,
			'./logger': {
				info: loggerInfo,
				getContext: function () {}
			}
		}),
		job = {
			data: {
				minZoom: 0,
				maxZoom: 2,
				image: 'image.jpg',
				dir: 'dir/',
				status: {
					tiled: false
				}
			}
		};

	it('executes the tile generating process', function () {
		generateTiles(job);

		expect(collector.script).toHaveBeenCalledWith('gdal2tiles.py');
		expect(collector.args).toHaveBeenCalledWith(
			['-p', 'raster', '-z', job.data.minZoom + '-' + job.data.maxZoom, '-w', 'none', '-r', 'near', job.data.image, job.data.dir]
		);
	});

	it('doesn\'t execute tile generation process if tiles already created', function () {
		job.data.status.tiled = true;

		generateTiles(job);

		expect(loggerInfo).toHaveBeenCalled();
		expect(loggerInfo).toHaveBeenCalledWith('Tiles already generated in: ' + job.data.dir);
		expect(qStub.defer.resolve).toHaveBeenCalled();
		expect(qStub.defer.resolve).toHaveBeenCalledWith(job);
	})
});
