'use strict';

/**
 * @desc Tries to parse raw request body to JSON
 * @param rawBody {string} - http request raw body
 * @returns {object|string} - request body parsed to JSON or raw body if parsing fails
 */

function parseRequestBody(rawBody) {
	var body;

	try {
		body = JSON.parse(rawBody);
	} catch (err) {
		if (err) {
			body = rawBody
		}
	}

	return body;
}

module.exports = parseRequestBody;
