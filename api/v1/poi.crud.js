'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	jsonValidator = require('./../../lib/jsonValidator'),

	dbTable = 'poi',
	createSchema = {
		description: 'Schema for creating POI',
		type: 'Object',
		properties: {
			name: {
				description: 'POI name',
				type: 'string',
				required: true
			},
			poi_category_id: {
				description: 'Unique identifier for category',
				type: 'integer',
				required: true
			},
			map_id: {
				description: 'Unique identifier for map',
				type: 'integer',
				required: true
			},
			description: {
				description: 'POI description',
				type: 'string'
			},
			link: {
				description: 'Link to article connected with this POI',
				type: 'string',
				pattern: '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})'
			},
			photo: {
				description: 'Link photo connected with this POI',
				type: 'string',
				pattern: '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})'
			},
			lat: {
				description: 'POI latitude',
				type: 'number',
				required: true
			},
			lon: {
				description: 'POI longitude',
				type: 'number',
				required: true
			},
			created_by: {
				description: 'creator user name',
				type: 'string',
				required: true
			}
		},
		additionalProperties: false
	},
	updateSchema = {
		description: 'Schema for updating POI',
		type: 'Object',
		properties: {
			name: {
				description: 'POI name',
				type: 'string'
			},
			poi_category_id: {
				description: 'Unique identifier for category',
				type: 'integer'
			},
			description: {
				description: 'POI description',
				type: 'string'
			},
			link: {
				description: 'Link to article connected with this POI',
				type: 'string',
				pattern: '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})',
				format: 'uri'
			},
			photo: {
				description: 'Link photo connected with this POI',
				type: 'string',
				pattern: '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})',
				format: 'uri'
			},
			lat: {
				description: 'POI latitude',
				type: 'number'
			},
			lon: {
				description: 'POI longitude',
				type: 'number'
			},
			updated_by: {
				description: 'Editor user name',
				type: 'string',
				required: true
			}
		},
		additionalProperties: false
	};

/**
 * @desc Helper function to update map's updated_on field
 *
 * @param mapId {number}
 * @returns {object}
 */
function changeMapUpdatedOn(mapId) {
	return dbCon.update(
		'map', {
			updated_on: dbCon.raw('CURRENT_TIMESTAMP')
		}, {
			id: mapId
		}
	);
}


/**
 * Helper function to get map_id from poi_id
 *
 * @param poiId {number}
 * @returns {object}
 */
function getMapIdByPoiId(poiId) {
	return dbCon.select(
		'poi', ['map_id'], {
			id: poiId
		}
	);
}

/**
 * @desc Creates CRUD collection based on configuration object passed as parameter
 * @returns {object} - CRUD collection
 */

module.exports = function createCRUD() {
	return {
		handler: {
			GET: function (req, res, next) {
				var dbColumns = ['id', 'name'];
				dbCon
					.select(dbTable, dbColumns)
					.then(
						function (collection) {
							res.send(200, collection);
							res.end();
						},
						next
				);
			},
			POST: function (req, res, next) {
				var reqBody = reqBodyParser(req.rawBody),
					errors = jsonValidator(reqBody, createSchema);

				if (errors.length === 0) {
					dbCon
						.insert(dbTable, reqBody)
						.then(
							function (data) {
								var id = data[0],
									response = {
										message: 'POI successfully created',
										id: id,
										url: req.protocol + '://' + req.headers.host + req.route.path + '/' + id
									};
								changeMapUpdatedOn(reqBody.map_id).then(
									function () {
										res.send(201, response);
										res.end();
									},
									next
								);
							},
							next
					);
				} else {
					next({
						status: 400,
						message: {
							message: 'Bad request',
							details: errors
						}
					});
				}
			}
		},
		wildcard: {
			DELETE: function (req, res, next) {
				var id = parseInt(req.pathVar.id),
					filter = {
						id: id
					};
				if (isFinite(id)) {
					getMapIdByPoiId(id).then(
						function (rows) {
							if (rows.length > 0) {
								dbCon
									.destroy(dbTable, filter)
									.then(
										function () {
											changeMapUpdatedOn(rows[0].map_id).then(
												function () {
													res.send(204, {});
													res.end();
												},
												next
											);
										},
										next
								);
							} else {
								next({
									status: 404,
									message: {
										message: 'POI not found',
										details: 'id: ' + req.pathVar.id + ' not found'
									}
								});
							}
						},
						next
					);
				} else {
					next({
						status: 400,
						message: {
							message: 'Bad request',
							details: 'id: ' + req.pathVar.id + ' should be a number'
						}
					});
				}
			},
			GET: function (req, res, next) {
				var dbColumns = ['name', 'poi_category_id', 'description', 'link', 'photo', 'lat', 'lon',
					'created_on', 'created_by', 'updated_on', 'updated_by', 'map_id'
				],
					id = parseInt(req.pathVar.id),
					filter = {
						id: id
					};

				if (isFinite(id)) {
					dbCon
						.select(dbTable, dbColumns, filter)
						.then(
							function (collection) {
								if (collection[0]) {
									res.send(200, collection[0]);
									res.end();
								} else {
									next({
										status: 404,
										message: {
											message: 'POI not found',
											id: id
										}
									});
								}
							},
							next
					);
				} else {
					next({
						status: 400,
						message: {
							message: 'Bad request',
							details: 'id: ' + req.pathVar.id + ' should be a number'
						}
					});
				}
			},
			PUT: function (req, res, next) {
				var reqBody = reqBodyParser(req.rawBody),
					errors = jsonValidator(reqBody, updateSchema);

				if (errors.length === 0) {
					var id = parseInt(req.pathVar.id),
						filter = {
							id: id
						};

					if (isFinite(id)) {
						getMapIdByPoiId(id).then(
							function (rows) {
								if (rows.length > 0) {
									dbCon
										.update(dbTable, reqBody, filter)
										.then(
											function () {
												var response = {
													message: 'POI successfully updated',
													id: id,
													// TODO: refactor path building
													url: req.protocol + '://' + req.headers.host + '/api/v1/poi' + '/' + id
												};
												changeMapUpdatedOn(rows[0].map_id).then(
													function () {
														res.send(303, response);
														res.end();
													},
													next
												);
											},
											next
									);
								} else {
									next({
										status: 404,
										message: {
											message: 'POI not found',
											details: 'id: ' + req.pathVar.id + ' not found'
										}
									});
								}
							},
							next
						);
					} else {
						next({
							status: 400,
							message: {
								message: 'Bad request',
								details: 'id: ' + req.pathVar.id + ' should be a number'
							}
						});
					}

				} else {
					next({
						status: 400,
						message: errors
					});
				}
			}
		}
	};
};
