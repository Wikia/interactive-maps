'use strict';

var proxyquire = require('proxyquire').noCallThru(),
	stubs = require('./stubs');

describe('Optimize tiles', function () {
	var execSpy = jasmine.createSpy('execSpy'),
		loggerSpy = jasmine.createSpy('loggerSpy'),
		childProcessMock = {
			exec: execSpy
		};

	/**
	 * @desc Require optimize tiles module with mocked dependencies
	 *
	 * @param {boolean} isEnabled - flag to enable or disable optimizing
	 *
	 * @returns {object} - optimize tiles module
	 */

	function createOptimizeTilesMock(isEnabled) {
		return proxyquire('../lib/optimizeTiles', {
			child_process: childProcessMock,
			'./config': {
				optimize: isEnabled
			},
			'./utils': {
				getGlob: function () {}
			},
			'./logger': {
				info: loggerSpy,
				notice: loggerSpy,
				error: function () {}
			}
		});
	}

	/**
	 * @desc create job mock
	 *
	 * @param {boolean} isOptimized - flag set to true if optimizing job already completed
	 *
	 * @returns {object} - job mock
	 */

	function createJobMock(isOptimized) {
		return {
			data: {
				dir: 'test',
				status: {
					optimized: isOptimized
				}
			}
		};
	}


	it('executes the tile optimization process', function () {
		var optimizeTiles = createOptimizeTilesMock(true),
			job = createJobMock(false);

		optimizeTiles(job);

		expect(execSpy).toHaveBeenCalled();
	});

	it('doesn\'t execute the tile optimization process if tiles are already optimized', function () {
		var optimizeTiles = createOptimizeTilesMock(true),
			job = createJobMock(true);

		optimizeTiles(job);

		expect(loggerSpy).toHaveBeenCalledWith('Tiles already optimized');
	});

	it('doesn\'t execute the tile optimization process if it\'s disabled', function () {
		var optimizeTiles = createOptimizeTilesMock(false),
			job = createJobMock(false);

		optimizeTiles(job);

		expect(loggerSpy).toHaveBeenCalledWith('Optimizing images disabled');
	});
});
