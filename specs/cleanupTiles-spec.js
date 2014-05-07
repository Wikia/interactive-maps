/* global jasmine */
'use strict';

var proxyquire = require('proxyquire').noCallThru(),
	stubs = require('./stubs');

describe('Clean tiles', function () {

	var qStub,
		childProcessMock,
		loggerDebug = jasmine.createSpy('debug');


	/**
	 * @desc Creates job mock
	 *
	 * @param {boolean} isRemoved - flag for cleanup status
	 *
	 * @returns {object} - job mock
	 */

	function createJobMock(isRemoved) {
		return {
			data: {
				dir: 'fake_dir',
				minZoom: 1,
				maxZoom: 2,
				status: {
					removed: isRemoved
				}
			}
		};
	}

	/**
	 * @desc Creates mock of cleanupTiles module
	 *
	 * @param {boolean} isEnabled - flag to enable / disable cleanup
	 * @param {object} job - part of job data is needed for mocking
	 *
	 * @returns {object} - mock od cleanupTiles module
	 */

	function createCleanupTilesMock(isEnabled, job) {
		return proxyquire('../lib/cleanupTiles', {
			q: qStub.q,
			'child_process': childProcessMock,
			'./config': {
				cleanup: isEnabled
			},
			'./logger': {
				notice: function () {},
				debug: loggerDebug,
				info: function () {},
				error: function () {},
				getContext: function () {}

			},
			'./utils': {
				getGlob: function () {
					return job.data.dir + '/{' + job.data.minZoom + '..' + job.data.maxZoom + '}';
				}
			}
		});
	}

	beforeEach(function () {
		qStub = stubs.newQStub();
		childProcessMock = jasmine.createSpyObj('child_process', ['exec']);
	});

	it('does not run, if cleanup is disabled by config', function () {
		var job = createJobMock(false),
			cleanupTilesDisabled = createCleanupTilesMock(false, job);

		cleanupTilesDisabled(job);

		expect(childProcessMock.exec).not.toHaveBeenCalled();
		expect(qStub.defer.resolve).toHaveBeenCalledWith(job);
		expect(qStub.defer.resolve.callCount).toEqual(1);
	});

	it('executes rm with correct parameters', function () {
		var job = createJobMock(false),
			expected = 'rm -rf ' + job.data.dir + '/{' + job.data.minZoom + '..' + job.data.maxZoom + '}',
			cleanupTiles = createCleanupTilesMock(true, job);

		cleanupTiles(job);

		expect(childProcessMock.exec.calls[0].args[0]).toBe(expected);
	});

	it('does not run if tiles are already moved', function () {
		var job = createJobMock(true),
			cleanupTiles = createCleanupTilesMock(true, job);

		cleanupTiles(job);

		expect(loggerDebug).toHaveBeenCalled();
		expect(loggerDebug).toHaveBeenCalledWith('Tiles already removed in: ' + job.data.dir);

	});
});
