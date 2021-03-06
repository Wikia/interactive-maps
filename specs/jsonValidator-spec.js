'use strict';

describe('json validator', function () {
	var proxyquire = require('proxyquire').noCallThru(),
		validator = proxyquire('./../lib/jsonValidator', {
			'JSV': {
				JSV: {
					createEnvironment: function () {
						return {
							validate: function () {
								return {
									errors: true
								};
							}
						}
					}
				}
			}
		}),
		jsonValidator = validator.validateJSON;


	it('returns "Incorrect JSON format" error', function () {
		var testCases = [
			'bla bla bla',
			1,
			null, {},
			[],
			undefined,
			NaN
		];

		testCases.forEach(function (value) {
			var errors = jsonValidator(value);
			expect(Array.isArray(errors)).toBeTruthy();
			expect(errors.length).toBe(1);
			expect(errors[0]).toBe('Incorrect JSON format');
		});
	});

	it('passes correct JSON object to validation module', function () {
		var testCases = [{
				test: 1
			},
			[1, 2, 3]
		];

		testCases.forEach(function (value) {
			var errors = jsonValidator(value);

			expect(errors).toBe(true);
		});
	});
});
