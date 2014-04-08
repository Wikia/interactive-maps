'use strict';

module.exports = {
	/**
	 * @desc Returns max zoom level based on image dimensions
	 * @param width {number} - image width
	 * @param height {number} - image height
	 * @returns {number} - max zoom level
	 */
	getMaxZoomLevel: function (width, height, maxZoom) {
		var size = Math.max(width, height);

		return Math.min(parseInt( Math.log(size) / Math.log(2), 10) - 8, maxZoom);
	},

	/**
	 * @desc Generates bucket name based on bucket prefix and map name
	 * @param {string} bucketPrefix
	 * @param {string} mapName
	 * @returns {string}
	 */
	getBucketName: function (bucketPrefix, mapName) {
		return encodeURIComponent(bucketPrefix + mapName.replace(/[ \/]/g, '_').trim());
	},

	/**
	 * Extend first object with seconds object properties
	 * @param {object} object1
	 * @param {object} object2
	 */
	extendObject: function (object1, object2) {
		Object.keys(object2).forEach(function (key) {
			object1[key] = object2[key];
		});
	}

};
