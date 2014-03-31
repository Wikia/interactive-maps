var logger = require( 'logger.js' );

module.exports = {
	log : function(req, res, done) {
		logger.info( req, res );
		done();
	}
}
