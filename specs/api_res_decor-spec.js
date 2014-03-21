var decorator = require('../lib/api_res_decor');

describe('decorator', function() {

	var data = [
			{
				id: 1,
				name: 'test 1'
			},
			{
				id: 2,
				name: 'test 2'
			}
		];

	it('works without schema provided', function() {
		expect(decorator(data)).toEqual(data);
	});

	it('does not work with invalid schema type', function() {
		var schema = 1;
		expect(
			function () {
				decorator(data, schema)
			}
		)
		.toThrow(new Error('Invalid schema'));
	});

	it('works with valid schema type', function() {
		var schema = {
				test2: {
					paramName: 'test2'
				}
			};
		expect(decorator(data, schema)).not.toEqual(data);
	});

	it('adds the base url', function() {
		var schema = {
				id : {
					paramName: 'url',
					entryPoint: '123/'
				}
			},
			expected = [
				{
					id: 1,
					name: 'test 1',
					url: 'http://example.com/123/1'
				},
				{
					id: 2,
					name: 'test 2',
					url: 'http://example.com/123/2'
				}
			],
			baseUrl = 'http://example.com/';

		expect(JSON.stringify(decorator(data, schema, baseUrl)))
			.toEqual(JSON.stringify(expected));
	});

});
