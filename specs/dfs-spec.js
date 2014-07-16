'use strict';

describe('DFS', function () {
	var proxyquire = require('proxyquire').noCallThru(),
		dfs = proxyquire('../lib/dfs', {
			'./config': {
				swift: {
					servers: [
						''
					],
					config: {
						swiftAuthUrl: '',
						swiftUser: '',
						swiftKey: ''
					}
				}
			},
			'./logger': {
				error: function () {},
				debug: function () {}
			},
			http: {
				get: function (data, callback) {

					callback({
						res: {
							headers: {
								'x-storage-url': 'test url',
								'x-auth-token': 'test auth'
							}
						}
					});

					return {
						on: function () {

						}
					};
				}
			}
		});

	it('rejects promise on wrong params', function (done) {
		dfs.sendFiles().
		catch (function (err) {
			expect(err).toEqual({
				message: 'Most probably wrong key'
			});
			done();
		});
	});

	it('Uploads files', function () {
		var data = {
			bucket: '',
			dir: '',
			filePaths: ''
		};

		dfs.sendFiles(data.bucket, data.dir, data.filePaths);
	});
});
