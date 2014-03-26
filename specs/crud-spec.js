curd = require('../lib/curd');

describe('crud', function(){

	var config = {
		dbTable: 'test',
		dbColumns: 'test',
		customMethods: {
			'create': function() {},
			'update': function() {}
		},
		createSchema: {},
		updateSchema: {}
	};

	it('throws an exteption when config is not provided', function(){
		expect(
			function() {
				curd.createCollection()
			})
			.toThrow(new Error('Config must be an object!'));
	});

	it('throws an exteption when config.dbTable is not set', function(){
		expect(
			function() {
				curd.createCollection({});
			})
			.toThrow(new Error('Config properties "dbTable" and "dbColumns" are required!'));
	});

	it('creates curd object', function(){
		var curdObj = curd.createCollection(config)
		expect(typeof curdObj).toBe('object');
	});

});
