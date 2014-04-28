'use strict';

var fs = require('fs'),
	logger = require('./logger');

/**
 * @desc get all CRUD Collections paths from directory specified in 'absolutePath' argument
 * @param absolutePath {string} - absolute path to configs directory
 * @returns {object} - object containing paths to CRUD collection files
 */

function getCruds(absolutePath) {
	var cruds = {};

	fs.readdirSync(absolutePath).forEach(function (crud) {
		if (crud.match(/.+\.crud\.js$/g) !== null) {
			var name = crud.replace('.crud.js', '');
			cruds[name] = absolutePath + crud;
		}
	});

	return cruds;
}

/**
 * @desc require CRUD collection modules
 * @param cruds {object} - object with paths to CRUD collection files
 * @returns {object} - object with CRUD collection modules
 */

function requireCruds(cruds) {
	var crudModules = {};

	Object.keys(cruds).forEach(function (value) {
		var path = cruds[value],
			module = require(path);

		if (typeof module === 'function') {
			crudModules[value] = module;
		} else {
			logger.warning('CRUD module ' + path + ' should be a function returning CRUD collection object');
		}


	});

	return crudModules;
}

module.exports = {
	getCruds: getCruds,
	requireCruds: requireCruds
};
