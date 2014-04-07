'use strict';

describe('Validate Crud config', function () {

	var vcc = require('../lib/validateCurdConfig');

	it('Expects validateCurdConfig to be module', function () {
		expect(vcc).not.toBe(undefined);
	});

	it('Throws error if config is not an object', function () {
		var testCases = [
			1,
			1.2,
			'',
			false,
			null
		];
		testCases.forEach(function (testCase) {
			expect(function () {
				vcc(testCase);
			}).toThrow(new Error('Config must be an object!'));
		});
	});

	it('Throws an error if dbTable and dbColumns are not set', function () {
		var testCases = [{}, {
			dbTable: ''
		}, {
			dbColumns: ''
		}];
		testCases.forEach(function (testCase) {
			expect(function () {
				vcc(testCase);
			}).toThrow(new Error('Config properties "dbTable" and "dbColumns" are required!'));
		});
	});

	it('Throws an error if createSchema is not set and handler.POST is not disabled', function () {
		var testCases = [{
			dbTable: '',
			dbColumns: '',
			blockedMethods: {
				handler: {
					POST: true
				}
			}
		}, {
			dbTable: '',
			dbColumns: '',
			blockedMethods: {
				handler: {
					POST: true
				}
			},
			createSchema: false
		}];
		testCases.forEach(function (testCase) {
			expect(function () {
				vcc(testCase);
			}).toThrow(new Error('Schema for validating object creation is required!'));
		});
	});

	it('Throws an error if createSchema is not set and handler.POST is not disabled', function () {
		var testCases = [{
			dbTable: '',
			dbColumns: '',
			blockedMethods: {
				handler: {
					POST: false
				},
				wildcard: {
					PUT: true
				}
			}
		}, {
			dbTable: '',
			dbColumns: '',
			blockedMethods: {
				handler: {
					POST: false
				},
				wildcard: {
					PUT: true
				}
			},
			updateSchema: false
		}];
		testCases.forEach(function (testCase) {
			expect(function () {
				vcc(testCase);
			}).toThrow(new Error('Schema for validating object updating is required!'));
		});
	});

	it('Return undefined if all conditions are met', function () {
		var testCase = {
			dbTable: '',
			dbColumns: '',
			blockedMethods: {
				handler: {
					POST: false
				},
				wildcard: {
					PUT: true
				}
			},
			createSchema: {},
			updateSchema: {}
		};
		expect(typeof vcc(testCase)).toBe('undefined');
	});
});
