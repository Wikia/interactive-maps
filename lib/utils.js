'use strict';

var maxLat = 90,
	maxLon = 180,

	/**
	 * POI Category marker statuses
	 */
	poiCategoryStatus =  {
		external: 0,
		dfs: 1
	};

module.exports = {

	/**
	 * TileSet statuses
	 */
	tileSetStatus: {
		ok: 0,
		failed: 1,
		processing: 2
	},

	poiCategoryStatus: poiCategoryStatus,

	/**
	 * Prefix used to while creating Surrogate-key field in HEAD
	 */
	surrogateKeyPrefix: 'map-',

	/**
	 * @desc Returns max zoom level based on image dimensions
	 *
	 * @param {number} width - image width
	 * @param {number} height - image height
	 * @param {number} maxZoom - max zoom level, to prevent generating too many levels for maps
	 * @returns {number} - max zoom level
	 */
	getMaxZoomLevel: function (width, height, maxZoom) {
		var size = Math.max(width, height);

		return Math.min(Math.ceil(Math.log(size) / Math.log(2)) - 8, maxZoom);
	},

	/**
	 * @desc Generates bucket name based on bucket prefix and tile set id
	 *
	 * @param {string} bucketPrefix
	 * @param {number} tileSetId
	 * @returns {string}
	 */
	getBucketName: function (bucketPrefix, tileSetId) {
		return encodeURIComponent(bucketPrefix + tileSetId);
	},

	/**
	 * @desc Extend first object with seconds object properties
	 *
	 * @param {object} object1
	 * @param {object} object2
	 */
	extendObject: function (object1, object2) {
		Object.keys(object2).forEach(function (key) {
			object1[key] = object2[key];
		});
		return object1;
	},

	/**
	 * @desc Returns hrtime difference in milliseconds
	 *
	 * @param {array} hrTimeDiff
	 * @returns {number}
	 */
	hrTimeToMilliseconds: function (hrTimeDiff) {
		return Math.ceil(hrTimeDiff[0] * 1000 + hrTimeDiff[1] * 1e-6);
	},

	/**
	 * @desc Returns a glob path to a folder
	 *
	 * @example base/0/0/0.png
	 * @example base/{0..4}/0/0.png
	 *
	 * @param {string} base path
	 * @param {number} min - min zoom level
	 * @param {number} max - max zoom level
	 * @param {string} postfix
	 * @returns {string}
	 */
	getGlob: function (base, min, max, postfix) {
		base = (base || '') + '/';

		if (min === max) {
			base += min;
		} else {
			base += '{' + min + '..' + max + '}';
		}

		if (postfix) {
			base = base + postfix;
		}

		return base;
	},

	/**
	 * @desc Converts zoom level{s} to its binary number
	 *
	 * @examples
	 * 1 -> 1
	 * 2 -> 2
	 * 4 -> 8
	 * 6 -> 32
	 * 1,2 -> 3
	 * 1,3 -> 7
	 *
	 * @param {number} minZoom min zoom level
	 * @param {number} maxZoom max zoom level
	 * @returns {number} integer that is a binary representation of a zoom level
	 */
	zoomLevelsToBin: function (minZoom, maxZoom) {
		var result = 0;

		//if both are zero then bin is also zero
		if (minZoom === 0 && maxZoom === 0) {
			result = 0;
		} else if (minZoom === maxZoom) {
			result += Math.pow(2, minZoom - 1);
		} else if (minZoom < maxZoom) {
			minZoom = Math.max(minZoom, 1);

			for (; minZoom <= maxZoom; minZoom++) {
				result += Math.pow(2, minZoom - 1);
			}
		}

		return result;
	},

	/**
	 * @desc Converts binary to max zoom level
	 *
	 * @examples
	 * bin  dec ->result (num.length - num.search(/1*$/))
	 * 1011 (11)-> 2  (4 - 2)
	 * 1001 (9) -> 1  (4 - 3)
	 * 1100 (12)-> 0  (4 - 4)
	 * 1111 (15)-> 4  (4 - 0)
	 *
	 * @param {number} num integer that is a binary representation of a zoom level
	 * @returns {number} max zoom level that we can display
	 */
	binToMaxZoomLevel: function (num) {
		num = (num || 0).toString(2); //We need to convert it to binary first

		//asterisk is here as if there are 0 at the end I want it to equal to a string length
		return num.length - num.search(/1*$/);
	},

	/**
	 * @desc Generate response url
	 *
	 * @param {object} req - Request object
	 * @param {string} path - path to the resource
	 * @param {string} id - entity id
	 * @returns {string} - URL to the entity
	 */
	responseUrl: function (req, path, id) {
		return req.protocol + '://' + req.headers.host + path + '/' + id;
	},

	/**
	 * @desc Generates DFS image url
	 *
	 * @param {string} dfsHost - HTTP server hostname for DFS files
	 * @param {string} path - path to the resource
	 * @param {string} image - image name
	 * @returns {string} - URL to DFS stored image
	 */
	imageUrl: function (dfsHost, path, image) {
		return 'http://' + dfsHost + '/' + path + '/' + image;
	},

	/**
	 * @desc Get North-East corner of the image in LatLng coordinates
	 *
	 * A short technical description on how this is supposed to work:
	 * In a perfect world the earth will be flat rectangle, but unfortunately the world is not perfect.
	 * Any  point on map has two coordinates, latitude [-90..90] and longitude [-180..180]. Map's boundaries are
	 * represented by both the SouthWest and NorthEast corners of the image.
	 * To get these coordinates we:
	 *  - figure out the map size for this map level (equal to 2^(zoomLevel + 8) )
	 *  - tiling process places the image always on the lower-left corner of the map, that's why south and east are
	 *  always fixed to the lowest-left coordinates: (-90, -180)
	 *  - north and east coordinates are calculated by dividing the corresponding sizes to the ratio and compensating
	 *  for the negative coordinates
	 *
	 *
	 * @param {number} width Image width
	 * @param {number} height Image height
	 * @param {number} maxZoom Maximum zoom level
	 * @returns {object} LatLng object
	 *
	 */
	getMapBoundaries: function (width, height, maxZoom) {
		var size = Math.pow(2, maxZoom + 8),
			halfSize = size / 2,
			d = 180 / Math.PI;
		return {
			north: (2 * Math.atan(Math.exp((height - halfSize) / (halfSize) * Math.PI)) - (Math.PI / 2)) * d,
			east: (width / (size / (maxLon * 2))) - maxLon,
			south: -maxLat,
			west: -maxLon
		};
	},

	/**
	 * @desc Generates bucket name for markers
	 *
	 * @param {string} markersPrefix Marker prefix
	 * @param {number} mapId Map ID
	 * @returns {string} bucket name for markers
	 */
	getMarkersBucketName: function (markersPrefix, mapId) {
		return String(markersPrefix) + mapId;
	},

	/**
	 * @desc Converts markers file names to URLs
	 * @param {object} collection - Collection of POI categories
	 * @param {string} dfsHost - DFS host
	 * @param {string} bucketPrefix - Bucket prefix
	 * @param {string} markersPrefix - Markers prefix
	 */
	convertMarkersNamesToUrls: function (collection, dfsHost, bucketPrefix, markersPrefix) {
		var self = this;

		collection.forEach(function (value) {
			if (value.marker !== null) {
				// null markers will get default icon from Leaflet
				value.marker = self.imageUrl(
					dfsHost,
					bucketPrefix +
					self.getMarkersBucketName(markersPrefix, value.map_id),
					value.marker
				);
			}
		});
	},

	/**
	 * @desc If the marker is still being processed, set it to null
	 * @param {object} collection
	 */
	handleDefaultMarker: function (collection) {
		collection.map(function (item) {
			if (item.status === poiCategoryStatus.external) {
				item.marker = null;
			}
			return item;
		});
	},

	/**
	 * @desc Returns map's zoom level based on provided, max and min zoom levels
	 * @param {number} zoom  - user passed zoom level
	 * @param {number} minZoom - minimum zoom level
	 * @param {number} maxZoom - maximum zoom level
	 * @returns {number} - zoom level
	 */
	getZoomLevel: function (zoom, minZoom, maxZoom) {
		zoom = parseInt(zoom, 10) || Math.ceil((maxZoom - minZoom) / 2);
		return Math.max(Math.min(zoom, maxZoom), minZoom);
	},

	/**
	 * @desc Returns map's set or default latitude
	 * @param {number} latitude
	 * @param {object} boundaries
	 * @returns {number}
	 */
	getLatitude: function (latitude, boundaries) {
		return parseFloat(latitude) || (boundaries.south + boundaries.north) / 2;
	},

	/**
	 * @desc Returns map's set or default longitude
	 * @param {number} longitude
	 * @param {object} boundaries
	 * @returns {number}
	 */
	getLongitude: function (longitude, boundaries) {
		return parseFloat(longitude) || (boundaries.east + boundaries.west) / 2;
	},

	/**
	 * @desc Helper function to update map's updated_on field
	 * @param {object} dbCon instance of db_connector
	 * @param {number} mapId unique map id
	 * @returns {object}
	 */
	changeMapUpdatedOn: function (dbCon, mapId) {
		return dbCon.update(
			'map', {
				updated_on: dbCon.raw('CURRENT_TIMESTAMP')
			}, {
				id: mapId
			}
		);
	}
};
