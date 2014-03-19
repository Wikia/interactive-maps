/**
 * @desc extend objects with URL for API entry points
 * @param data {array} - array of objects that will be sent to API client
 * @param schema {object} - schema for creating URL for API call based on reference IDs
 * @param baseUrl {string} - base API entry point URL
 * @returns {array} - input data array with extended objects
 */

module.exports = function docorate( data, schema, baseUrl ) {
	var length = data.length,
		i,
		tempObj,
		tempData = data,
		p;

	// check if schema exist and if data is not an empty array
	if ( length && schema ) {
		tempData = [];

		for ( i = 0; i < length; i++ ) {
			tempObj = data[i];

			// compare object properties with schema and extend it with URLs based on schema
			for ( p in schema ) {
				if ( tempObj.hasOwnProperty( p ) ) {
					tempObj[ schema[p].paramName ] = baseUrl + schema[p].entryPoint + tempObj[p];
				}
			}

			tempData.push( tempObj );
		}
	}

	return tempData;
};
