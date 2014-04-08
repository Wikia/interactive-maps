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
						return (!dbMock.dbError) ? cb(dbMock[methods[value]]) : errCb(dbMock.dbError);
					}
				};
			}
		});

		return dbCon;
	},

	// require module
	crudBuilder = proxyquire('../lib/curdBuilder', {
		// mock dependencies
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


describe('CRUD Builder', function () {
	// mocks
	var config = {
			dbTable: 'test',
			dbColumns: ['test'],
			createSchema: {},
			updateSchema: {}
		},
		crudUrlPath = '/test/path/',
		req = {
			protocol: 'http',
			headers: {
				host: 'test.com'
			},
			pathVar: {
				id: '1'
			}
		},
		res = {
			statusCode: null,
			data: '',
			header: {
				a: '',
				b: ''
			},
			end: function(data) {
				this.data = data;
			},
			setHeader: function(a, b) {
				this.header.a = a;
				this.header.b = b;
			}
		};

	// tests

	it('should exist', function () {
		expect(crudBuilder).toBeDefined();
	});

	it('create CRUD Collection object', function() {
		var crud = crudBuilder(config, crudUrlPath);

		expect(typeof crud).toBe('object');
		expect(typeof crud.handler).toBe('object');
		expect(typeof crud.wildcard).toBe('object');
	});

	it('CRUD collection handler has POST and GET methods', function() {
		var crud = crudBuilder(config, crudUrlPath);

		expect(typeof crud.handler.GET).toBe('function');
		expect(typeof crud.handler.POST).toBe('function');
	});

	it('CRUD collection wildcard has DELETE, GET and UPDATE methods', function() {
		var crud = crudBuilder(config, crudUrlPath);

		expect(typeof crud.wildcard.GET).toBe('function');
		expect(typeof crud.wildcard.DELETE).toBe('function');
		expect(typeof crud.wildcard.PUT).toBe('function');
	});

	it('CRUD collection blocking methods functionality works', function() {
		var crud;

		// extend mocks
		config.blockedMethods = {
			wildcard: {
				DELETE: false
			}
		};

		crud = crudBuilder(config, crudUrlPath);

		expect(crud.wildcard.DELETE).toBe(false);

		// reset mocks
		delete config.blockedMethods;
	});

	it('CRUD collection overwriting methods functionality works', function() {
		var crud,
			result;

		// extend mocks
		config.customMethods = {
			list: function() {
				return {
					then: function(cb) {
						return cb('laughing pink unicorn');
					}
				}
			}
		};

		crud = crudBuilder(config, crudUrlPath);
		crud.handler.GET(req, res);
		result = res.data;

		expect(result).toBe('["laughing pink unicorn"]');

		// reset mocks
		delete config.customMethods;
	});

	it('CRUD collection handler GET returns 200', function() {
		var crud = crudBuilder(config, crudUrlPath);

		crud.handler.GET(req, res);

		expect(res.statusCode).toBe(200);
	});

	it('CRUD collection handler GET returns 500', function() {
		var crud = crudBuilder(config, crudUrlPath);

		dbMock.dbError = true;
		crud.handler.GET(req, res);

		expect(res.statusCode).toBe(500);

		// reset mocks
		dbMock.dbError = false;
	});

	it('CRUD collection handler POST 201', function() {
		var crud = crudBuilder(config, crudUrlPath);

		crud.handler.POST(req, res);

		expect(res.statusCode).toBe(201);
	});

	it('CRUD collection handler POST returns 500', function() {
		var crud = crudBuilder(config, crudUrlPath);

		dbMock.dbError = true;
		crud.handler.POST(req, res);

		expect(res.statusCode).toBe(500);

		// reset mocks
		dbMock.dbError = false;
	});

	it('CRUD collection wildcard GET 200', function() {
		var crud = crudBuilder(config, crudUrlPath);

		crud.wildcard.GET(req, res);

		expect(res.statusCode).toBe(200);
	});

	it('CRUD collection wildcard GET returns 404', function() {
		var crud = crudBuilder(config, crudUrlPath);

		dbMock.result = [];
		crud.wildcard.GET(req, res);

		expect(res.statusCode).toBe(404);

		dbMock.result = ['test'];
	});

	it('CRUD collection wildcard GET returns 500', function() {
		var crud = crudBuilder(config, crudUrlPath);

		dbMock.dbError = true;
		crud.wildcard.GET(req, res);

		expect(res.statusCode).toBe(500);

		// reset mocks
		dbMock.dbError = false;
	});

	it('CRUD collection wildcard PUT 303', function() {
		var crud = crudBuilder(config, crudUrlPath);

		crud.wildcard.PUT(req, res);

		expect(res.statusCode).toBe(303);
	});

	it('CRUD collection wildcard PUT 500', function() {
		var crud = crudBuilder(config, crudUrlPath);

		dbMock.dbError = true;
		crud.wildcard.PUT(req, res);

		expect(res.statusCode).toBe(500);

		// reset mocks
		dbMock.dbError = false;
	});

	it('CRUD collection wildcard DELETE returns 204', function() {
		var crud = crudBuilder(config, crudUrlPath);

		crud.wildcard.DELETE(req, res);

		expect(res.statusCode).toBe(204);
	});

	it('CRUD collection wildcard DELETE returns 500', function() {
		var crud = crudBuilder(config, crudUrlPath);

		dbMock.dbError = true;
		crud.wildcard.DELETE(req, res);

		expect(res.statusCode).toBe(500);

		// reset mocks
		dbMock.dbError = false;
	});

	it('builds custom response data', function() {
		var crud,
			postData,
			putData;

		// extend
		config.customResObjects = {
			create: {
				message: 'Pink unicorns flying!'
			},
			update: {
				message: 'Blue unicorns flying!'
			}
		};

		crud = crudBuilder(config, crudUrlPath);

		crud.handler.POST(req, res);
		postData = JSON.parse(res.data);

		crud.wildcard.PUT(req, res);
		putData = JSON.parse(res.data);

		expect(postData.message).toBe('Pink unicorns flying!');
		expect(postData.id).toBe(1);
		expect(putData.message).toBe('Blue unicorns flying!');
		expect(putData.id).toBe(1);

		// reset mocks
		delete config.customResObjects;
	});
});
