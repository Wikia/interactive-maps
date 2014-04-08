'use strict';

var proxyquire = require('proxyquire').noCallThru(),

	// db emulation mock
	dbMock = {
		id: 1,
		result: ['test'],
		dbError: false
	},

	// helper function for mocking DB connector
	mockDbCon = function() {
		var methods = {
				destroy: false,
				insert: 'id',
				select: 'result',
				update: 'id'
			},
			dbCon = {};

		Object.keys(methods).forEach(function(value) {
			dbCon[value] = function() {
				return {
					then: function(cb, errCb) {
						return !dbMock.dbError ? cb(dbMock[methods[value]]) : errCb(dbMock.dbError);
					}
				};
			};
		});

		return dbCon;
	},

	curdBuilder = proxyquire('../lib/curdBuilder', {
		'./db_connector': mockDbCon(),
		'./requestBodyParser': function(reqBody) {
			return reqBody;
		},
		'./validateCurdConfig': function() {},
		'./jsonValidator': function(reqBody, schema) {
			var errors = [];

			if (!schema) {
				errors.push(true);
			}

			return errors;
		},
		'./api_res_decor': function(data) {
			if (!Array.isArray(data)) {
				data = [data];
			}

			return data;
		}
	});


describe('Curd Builder module', function () {
	// mocks
	var config = {
			dbTable: 'test',
			dbColumns: ['test'],
			createSchema: {},
			updateSchema: {}
		},
		curdUrlPath = '/test/path/',
		req = {
			protocol: 'http',
			headers: {
				host: 'test.com'
			},
			pathVar: {
				id: '1'
			}
		},
		stubRes = function(){
			return {
				statusCode: null,
				data: '',
				header: {
					a: '',
					b: ''
				},
				end: function(data) {
					if(data) {
						this.data = data;
					}
				},
				send: function(status, data){
					this.statusCode = status;
					this.data = data;
				},
				setHeader: function(a, b) {
					this.header.a = a;
					this.header.b = b;
				}
			};
		};

	it('should exist', function () {
		expect(curdBuilder).toBeDefined();
	});

	it('create curd Collection object', function() {
		var curd = curdBuilder(config, curdUrlPath);

		expect(typeof curd).toBe('object');
		expect(typeof curd.handler).toBe('object');
		expect(typeof curd.wildcard).toBe('object');
	});

	it('curd collection handler has POST and GET methods', function() {
		var curd = curdBuilder(config, curdUrlPath);

		expect(typeof curd.handler.GET).toBe('function');
		expect(typeof curd.handler.POST).toBe('function');
	});

	it('curd collection wildcard has DELETE, GET and UPDATE methods', function() {
		var curd = curdBuilder(config, curdUrlPath);

		expect(typeof curd.wildcard.GET).toBe('function');
		expect(typeof curd.wildcard.DELETE).toBe('function');
		expect(typeof curd.wildcard.PUT).toBe('function');
	});

	it('curd collection blocking methods functionality works', function() {
		var curd;

		// extend mocks
		config.blockedMethods = {
			DELETE: false
		};

		curd = curdBuilder(config, curdUrlPath);

		expect(curd.wildcard.DELETE).toBe(false);

		// reset mocks
		delete config.blockedMethods;
	});

	it('curd collection overwriting methods functionality works', function() {
		var curd,
			result,
			res = stubRes();

		dbMock.dbError = false;

		// extend mocks
		config.customMethods = {
			list: function() {
				return {
					then: function(cb) {
						return cb('test test');
					}
				};
			}
		};

		curd = curdBuilder(config, curdUrlPath);
		curd.handler.GET(req, res);
		result = res.data;

		expect(result).toEqual([ 'test test' ]);

		// reset mocks
		delete config.customMethods;
	});

	it('curd collection handler GET returns 200', function() {
		var res = stubRes(),
			curd = curdBuilder(config, curdUrlPath);

		curd.handler.GET(req, res);

		expect(res.statusCode).toBe(200);
	});

	it('curd collection handler GET returns 500', function() {
		var res = stubRes(),
			curd = curdBuilder(config, curdUrlPath);

		dbMock.dbError = true;
		curd.handler.GET(req, res, function(err){
			expect(err.status).toBe(500);
		});

		// reset mocks
		dbMock.dbError = false;
	});

	it('curd collection handler POST 201', function() {
		var res = stubRes(),
			curd = curdBuilder(config, curdUrlPath);

		dbMock.dbError = false;
		curd.handler.POST(req, res);

		expect(res.statusCode).toBe(201);
	});

	it('curd collection handler POST returns 500', function() {
		var res = stubRes(),
			curd = curdBuilder(config, curdUrlPath);

		dbMock.dbError = true;
		curd.handler.POST(req, res, function(err){
			expect(err.status).toBe(500);
		});

		// reset mocks
		dbMock.dbError = false;
	});

	it('curd collection wildcard GET 200', function() {
		var res = stubRes(),
			curd = curdBuilder(config, curdUrlPath);

		dbMock.dbError = false;
		curd.wildcard.GET(req, res);

		expect(res.statusCode).toBe(200);
	});

	it('curd collection wildcard GET returns 404', function() {
		var res = stubRes(),
			curd = curdBuilder(config, curdUrlPath);

		dbMock.dbError = false;
		dbMock.result = [];
		curd.wildcard.GET(req, res, function(err){
			expect(err.status).toBe(404);
		});

		dbMock.result = ['test'];
	});

	it('curd collection wildcard GET returns 500', function() {
		var res = stubRes(),
			curd = curdBuilder(config, curdUrlPath);

		dbMock.dbError = true;
		curd.wildcard.GET(req, res, function(err){
			expect(err.status).toBe(500);
		});

		// reset mocks
		dbMock.dbError = false;
	});

	it('curd collection wildcard PUT 303', function() {
		var res = stubRes(),
			curd = curdBuilder(config, curdUrlPath);

		curd.wildcard.PUT(req, res);

		expect(res.statusCode).toBe(303);
	});

	it('curd collection wildcard PUT 500', function() {
		var res = stubRes(),
			curd = curdBuilder(config, curdUrlPath);

		dbMock.dbError = true;
		curd.wildcard.PUT(req, res, function(err){
			expect(err.status).toBe(500);
		});

		// reset mocks
		dbMock.dbError = false;
	});

	it('curd collection wildcard DELETE returns 204', function() {
		var res = stubRes(),
			curd = curdBuilder(config, curdUrlPath);

		dbMock.dbError = false;
		curd.wildcard.DELETE(req, res);

		expect(res.statusCode).toBe(204);
	});

	it('curd collection wildcard DELETE returns 500', function() {
		var res = stubRes(),
			curd = curdBuilder(config, curdUrlPath);

		dbMock.dbError = true;
		curd.wildcard.DELETE(req, res, function(err){
			expect(err.status).toEqual(500);
		});

		// reset mocks
		dbMock.dbError = false;
	});

	it('builds custom response data', function() {
		var res = stubRes(),
			curd;

		// extend
		config.customResObjects = {
			create: {
				message: 'Pink unicorns flying!'
			},
			update: {
				message: 'Blue unicorns flying!'
			}
		};

		curd = curdBuilder(config, curdUrlPath);

		curd.handler.POST(req, res, function(err){
			expect(err.status).toEqual(500);
			expect(err.message).toBe('Internal server error');
		});

		curd.wildcard.PUT(req, res, function(err){
			expect(err.status).toEqual(500);
			expect(err.message).toBe('Internal server error');
		});

		// reset mocks
		delete config.customResObjects;
	});
});
