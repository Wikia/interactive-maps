'use strict';

describe('DFS', function () {
	var proxyquire = require('proxyquire').noCallThru(),
		dfs = proxyquire('../lib/dfs', {
			'./config': {
				swift: {
					servers: [
						'127.0.0.1:80'
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

	it('gets correct pair of IP and port for DFS', function () {
		var testCases = [
			{
				dfs: 's3.dev-dfs-p1',
				expected: ['s3.dev-dfs-p1', 80]
			},
			{
				dfs: 's3.dev-dfs-p1:1234',
				expected: ['s3.dev-dfs-p1', 1234]
			},
			{
				dfs: '10.1.2.3:1234',
				expected: ['10.1.2.3', 1234]
			}
		];

		testCases.forEach(function (testCase) {
			expect(dfs.getDFSHostAndPort(testCase.dfs)).toEqual(testCase.expected);
		});
	});

	it('throws correct errors when invalid DFS addressed are given', function () {
		expect(function () {
			dfs.getDFSHostAndPort('');
		}).toThrow('Invalid DFS address.');

		expect(function () {
			dfs.getDFSHostAndPort('10.1.2.3:1234:5678');
		}).toThrow('Invalid DFS address. Most probably two many semicolons.');
	});
});
