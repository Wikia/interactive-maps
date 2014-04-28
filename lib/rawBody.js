/**
 * @desc simple express middleware that extends request object with raw body of the request
 * @param req {object} - http request object
 * @param res {object} - http response object
 * @param next {function} - callback function
 */

function rawBody(req, res, next) {
	req.setEncoding('utf8');
	req.rawBody = '';
	req.on('data', function (chunk) {
		req.rawBody += chunk;
	});
	req.on('end', function () {
		next();
	});
}

exports = module.exports = rawBody;
