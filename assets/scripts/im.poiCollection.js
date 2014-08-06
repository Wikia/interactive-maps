'use strict';

define('im.poiCollection', ['im.window'], function (w) {
	var doc = w.document,
		poiCache = {};

	/**
	 * @desc Loads poi of given category to cache and returns them
	 * @param {number} poiCategory - Id of poi category, 0 for all types
	 * @returns {NodeList} - List of DOM elements corresponding with given poi category
	 */
	function loadPoiToCache(poiCategory) {
		poiCache[poiCategory] = doc.querySelectorAll(
			(poiCategory === 0) ?
				'.leaflet-marker-icon, .leaflet-marker-shadow' :
				'.point-type-' + poiCategory
		);

		return poiCache[poiCategory];
	}

	/**
	 * @desc Deletes poi from poi cache
	 * @param {number} poiCategory - Id of point type
	 */
	function invalidatePoiCache(poiCategory) {
		delete poiCache[poiCategory];
	}

	/**
	 * @desc Return DOM elements for given poi category
	 * @param {number} poiCategory - Id of poi category, 0 for all types
	 * @returns {NodeList} - List of DOM elements corresponding with given poi category
	 */
	function getPoiByCategory(poiCategory) {
		return (poiCache.hasOwnProperty(poiCategory)) ? poiCache[poiCategory] : loadPoiToCache(poiCategory);
	}

	return {
		invalidatePoiCache: invalidatePoiCache,
		getPoiByCategory: getPoiByCategory
	};
});
