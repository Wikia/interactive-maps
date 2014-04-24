'use strict';

describe('Get CRUDs', function () {

	var proxyquire = require('proxyquire').noCallThru(),
		crudModules,
		getCRUDs = proxyquire('./../lib/getCRUDs', {
			'fs': {
				readdirSync: function () {
					return crudModules;
				}
			}
		});

	/**
	 * @desc helper function that build array of CRUD module names
	 * @returns {array} - array of CRUD module names
	 */

	function getCruds() {
		return Object.keys(getCRUDs.getCruds());
	}

	it('builds an array of API CRUD modules', function () {
		var crudNamesArray;

		crudModules = [
			'test1.crud.js',
			'test2.crud.js',
			'test3.blabla.crud.js'
		];
		crudNamesArray = getCruds();

		expect(crudNamesArray.length).toBe(3);
		expect(crudNamesArray[0]).toBe('test1');
		expect(crudNamesArray[1]).toBe('test2');
		expect(crudNamesArray[2]).toBe('test3.blabla');
	});

	it('skips non config files', function () {
		var crudNamesArray;

		crudModules = [
			'lorem.ispum.js',
			'blabla.js',
			'blabla.crud.bla.js',
			'test123.crud.js.bla'
		];
		crudNamesArray = getCruds();

		expect(crudNamesArray.length).toBe(0);
	});
});
