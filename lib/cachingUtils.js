/**
 * Module to add custom HTTP Request headers
 */
'use strict';

module.exports = {

	/**
	 * @desc Adds caching headers
	 *
	 * @param req {object}
	 * @param res {object}
	 * @param next {function}
	 */
	middleware: function(req, res, next) {
		res.set({
			'Cache-Control': 'public, max-age=300, s-maxage=300',
			'X-Backend': 'dev_nandy',
			'X-Cache': 'ORIGIN'
		});

		return next();
	}

};
