var Knex = require('knex'),
	config = require('./config'),
	knex;

Knex.knex = Knex.initialize({
	client: 'mysql',
	connection: config.db
});

knex = Knex.knex;

function sel(table, colomns, where) {
	var query = knex(table).column(colomns);

	if (where) {
		query.where(where);
	}

	return query.select();
}

function ins(table, data) {
	return knex(table).insert(data);
}

function del(table, id) {
	return knex(table).where(id ).del();
}

function upd(table, data, id) {
	return knex(table).where(id).update(data);
}

module.exports = {
	sel: sel,
	ins: ins,
	del: del,
	upd: upd
}
