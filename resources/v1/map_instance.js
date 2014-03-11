var dbCon = require('./../../lib/db_connector'),
	CURDCollection = require('percolator').CRUDCollection,
	schemas = require('./../../schemas/map_instance.schema.js' ),

	collection = new CURDCollection({
		createSchema: schemas.createSchema,
		updateSchema: schemas.updateSchema,

		create: function(req, res, obj, cb) {
			var query = dbCon.ins(
				'map_instance',
				obj
			);

			query.then(
				function(result) {
					console.log(result);
					console.log('Map instance "' + obj.title + '" saved with id: ' + result);
					cb(null, result);
				},
				function(err) {
					res.status.internalServerError(err);
				}
			);
		},
		destroy: function(req, res, id, cb) {
			var query = dbCon.del(
				'map_instance',
				{id: id}
			);

			query.then(
				function(result) {
					console.log(result);
					cb();
				},
				function(err) {
					res.status.internalServerError(err);
				}
			);

		},
		fetch: function(req, res, cb) {
			var query = dbCon.sel(
				'map_instance',
				['id', 'title', 'map_id', 'city_id', 'created_by', 'created_on', 'locked'],
				{id: req.uri.child()}
			);

			query.then(
				function(data) {
					(data[0]) ? cb(null, data[0]) : cb(true);
				},
				function(err) {
					res.status.internalServerError(err);
				}
			);
		},
		list: function(req, res, cb) {
			var query = dbCon.sel(
				'map_instance',
				['id', 'title', 'map_id', 'city_id', 'created_by', 'created_on', 'locked']
			);

			query.then(
				function(data) {
					(data.length) ? cb(null, data) : cb(true);
				},
				function(err) {
					res.status.internalServerError(err);
				}
			);
		},
		update : function(req, res, id, obj, cb) {
			var data = {},
				query;

			if (obj.title) {
				data.title = obj.title;
			}
			if (obj.map_id) {
				data.map_id = obj.map_id;
			}

			query = dbCon.upd(
				'map_instance',
				data,
				{id: id}
			);

			query.then(
				function(data) {
					cb(data);
				},
				function(err) {
					res.status.internalServerError(err);
				}
			);
		}
	});

exports.handler = collection.handler;
exports.wildcard = collection.wildcard;