'use strict';

describe('DFS', function () {
	var proxyquire = require('proxyquire').noCallThru(),
		dfs = proxyquire('../lib/dfs', {
			'./config': {
				swift: {
					servers: [
						'127.0.0.1'
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
				expected: {
					host: 's3.dev-dfs-p1',
					hostname: 's3.dev-dfs-p1',
					port: 80
				}
			},
			{
				dfs: 's3.dev-dfs-p1:1234',
				expected: {
					host: 's3.dev-dfs-p1:1234',
					hostname: 's3.dev-dfs-p1',
					port: 1234
				}
			},
			{
				dfs: '10.1.2.3:1234',
				expected: {
					host: '10.1.2.3:1234',
					hostname: '10.1.2.3',
					port: 1234
				}
			},
			{
				dfs: '127.0.0.1',
				expected: {
					host: '127.0.0.1',
					hostname: '127.0.0.1',
					port: 80
				}
			}
		];

		testCases.forEach(function (testCase) {
			var result = dfs.getHostAndPort(testCase.dfs);
			expect(result.host).toEqual(testCase.expected.host);
			expect(result.hostname).toEqual(testCase.expected.hostname);
			expect(result.port).toEqual(testCase.expected.port);
		});
	});

	it('throws correct error when invalid DFS addressed are given', function () {
		expect(function () {
			dfs.getHostAndPort('');
		}).toThrow('Invalid address');
	});

	it('returns correct DFS hosts with different hosts lists', function () {
		var hostsListsMock = [
				['127.0.0.1:80'],
				['127.0.0.1:80', '127.0.0.1:6000', '127.0.0.1:123', 'dfs-lb.wikia.com', '10.10.132.15']
			],
			first,
			i = 0;

		expect(dfs.getDFS(hostsListsMock[0])).toEqual(dfs.getDFS(hostsListsMock[0]));
		expect(dfs.getDFS(hostsListsMock[1])).not.toEqual(dfs.getDFS(hostsListsMock[1]));

		// with this calls make it go back to 127.0.0.1:80 (the dfsHostIndex will increment to 11)
		for (i; i < 4; i++) {
			dfs.getDFS(hostsListsMock[1]);
		}
		first = dfs.getDFS(hostsListsMock[1]);
		// now loop again so we can check if it is round-robin ;)
		for (i = 0; i < 4; i++) {
			dfs.getDFS(hostsListsMock[1]);
		}
		expect(first).toEqual(dfs.getDFS(hostsListsMock[1]));
	});
});
