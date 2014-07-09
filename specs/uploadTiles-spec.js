'use strict';

var proxyquire = require('proxyquire').noCallThru(),
	stubs = require('./stubs');

describe('Upload Tiles', function () {

	it('Calls dfs sendFiles', function () {
		var qStub = stubs.newQStub(),
			collector = stubs.newCollector(['bucketName', 'dir', 'filePaths']),
			dfsStub = {
				sendFiles: function (bucketName, dir, filePaths) {
					collector.bucketName(bucketName);
					collector.dir(dir);
					collector.filePaths(filePaths);
					return {
						then: function (cb) {
							cb();
							return this;
						},
						catch: function () {}
					};
				}
			},
			uploadTiles = proxyquire('../lib/uploadTiles', {
				q: qStub.q,
				'./dfs': dfsStub,
				'./config': {
					minZoom: 0,
					bucketPrefix: 'bucketPrefix_',
					tileSetPrefix: 'tile_set_'
				}
			}),
			data = {
				tileSetId: 1,
				dir: 'dir',
				minZoom: 0,
				maxZoom: 3,
				status: {
					uploaded: false
				}
			},
			expected = {
				bucketName: 'bucketPrefix_tile_set_1',
				dir: 'dir',
				filePaths: '{0..3}/*/*.png'
			};

		uploadTiles({
			save: function () {},
			data: data
		});

		expect(qStub.defer.resolve.callCount).toEqual(1);
		expect(collector.bucketName).toHaveBeenCalledWith(expected.bucketName);
		expect(collector.dir).toHaveBeenCalledWith(expected.dir);
		expect(collector.filePaths).toHaveBeenCalledWith(expected.filePaths);
	});
});
