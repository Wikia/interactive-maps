'use strict';

describe('Request Body Parser', function () {
	var requestBodyParser = require('./../lib/requestBodyParser.js');

	it('parse raw request body to JSON', function() {
		var testCases = [
			'{"message": "Pink unicorns flying!"}',
			'{}',
			'[]',
			'1',
			'null'
		];

		testCases.forEach(function(value) {
			expect(typeof requestBodyParser(value) !== 'string').toBeTruthy();
		});
	});

	it('fails to parse raw request body to JSON', function() {
		var rawBody = '{"message: "Pink unicorns flying!"}';

		expect(typeof requestBodyParser(rawBody) === 'string').toBeTruthy();
	});
});

