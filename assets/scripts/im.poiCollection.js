'use strict';

define('im.poiCollection', ['im.window'], function (w) {
	var doc = w.document,
		// holds all poi objects currently displayed on map
		poisState = {},
		// holds all pois DOM elements grouped by poi categories
		poiCache = {};

	/**
	 * @desc checks if poi is in state
	 * @param {number} id - poi id
	 * @returns {boolean}
	 */
	function isPoiInState(id) {
		return (poisState.hasOwnProperty(id) ? true : false);
	}

	/**
	 * @desc adds poi to state
	 * @param {object} poi - poi object
	 * @throws {error} - if poi of the same id already is in state
	 */
	function addToState(poi) {
		var id = poi.id;

		if (isPoiInState(id)) {
			throw new Error('poi id:' + id + 'already exist in the poiState.');
		}

		poisState[id] = poi;
	}

	/**
	 * @desc removes poi from state
	 * @param {number} id - poi id
	 */
	function removeFromState(id) {
		if (isPoiInState(id)) {
			delete poisState[id];
		}
	}

	/**
	 * @desc return poi state
	 * @returns {object} - poi state
	 */
	function getPoiState() {
		return poisState;
	}

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
		isPoiInState: isPoiInState,
		addToState: addToState,
		getPoiState: getPoiState,
		removeFromState: removeFromState,
		invalidatePoiCache: invalidatePoiCache,
		getPoiByCategory: getPoiByCategory
	};
});
