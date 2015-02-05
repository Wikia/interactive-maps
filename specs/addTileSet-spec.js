'use strict';

var proxyquire = require('proxyquire').noCallThru(),
	stubs = require('./stubs'),
	conn = {},
	kue = {
		createQueue: function () {
			return {
				create: function (name, data) {

					expect(name).toEqual('process');

					return {
						priority: function () {
							return {
								save: function () {

								}
							};
						}
					};
				}
			};
		}
	},
	q = {
		defer: function () {
			return {
				promise: {
					then: function (cb) {
						cb([]);

						return {
							catch: function () {}
						};
					}
				},
				resolve: function () {}
			};
		}
	},
	dbconnector = {
		insert: function () {
			return {
				then: function () {
					return {
						catch: function () {}
					};
				},
				catch: function () {}
			};
		},
		select: function () {
			return q.defer().promise;
		}
	},
	addTileSet = proxyquire('../lib/addTileSet', {
		'q': q,
		'./db_connector': dbconnector,
		'kue': kue,
		'./config': {},
		'./logger': {}
	});

describe('addTileSet', function () {

	it('should return promise', function () {
		var promise = addTileSet(conn, 'test', {
			url: 'http://test.url',
			name: 'test name',
			created_by: 'user'
		});

		expect(promise.then).toBeDefined();
	});

	it('should add tile set to DB', function () {
		var data = {
			url: 'http://test.url/image.jpg',
			name: 'test name',
			created_by: 'user'
		},
			shouldAddTileSet = proxyquire('../lib/addTileSet', {
				'q': q,
				'./db_connector': {
					insert: function (conn, table, object) {
						expect(table).toEqual('test');
						expect(object).toEqual({
							name: 'test name',
							type: 'custom',
							url: 'http://test.url/image.jpg',
							image: 'image.jpg',
							width: 0,
							height: 0,
							min_zoom: 1,
							max_zoom: 0,
							status: 2,
							created_on: undefined,
							created_by: 'user'
						});

						return {
							then: function () {
								return {
									catch: function () {}
								};
							},
							catch: function () {}
						};
					},
					select: function () {
						return q.defer().promise;
					}
				},
				'kue': kue,
				'./config': {
					minZoom: 1
				}
			});

		shouldAddTileSet(conn, 'test', data);
	});

	it('should add tile set to processing', function () {
		var data = {
			url: 'http://test.url/image.jpg',
			name: 'test name',
			created_by: 'user'
		},
			shouldProcessTileSet = proxyquire('../lib/addTileSet', {
				'q': q,
				'./db_connector': dbconnector,
				'kue': {
					createQueue: function () {
						return {
							create: function (name, jobData) {

								expect(name).toEqual('process');
								expect(jobData).toEqual({
									fileUrl: data.url,
									name: data.name,
									user: data.created_by,
									dbTable: 'test',
									mapId: undefined
								});

								return {
									priority: function () {
										return {
											save: function () {

											}
										};
									}
								};
							}
						};
					}
				},
				'./config': {}
			});

		shouldProcessTileSet(conn, 'test', data);
	});
});
