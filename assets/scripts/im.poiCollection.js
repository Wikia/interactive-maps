define('im.poiCollection', ['im.window'], function (w) {
	'use strict';

	var doc = w.document,
		// holds all poi objects currently displayed on map
		poiObjectsState = {},
		// holds all pois DOM elements grouped by poi categories
		poiCategoriesCache = {};

	/**
	 * @desc setup initial poi state object
	 * @param {Array} pois
	 */
	function setupInitialPoiState(pois) {
		pois.forEach(function(poi) {
			addToState(poi);
		});
	}

	/**
	 * @desc checks if poi is in state
	 * @param {number} id - poi id
	 * @returns {boolean}
	 */
	function isPoiInState(id) {
		return poiObjectsState.hasOwnProperty(id);
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

		poiObjectsState[id] = poi;
	}

	/**
	 * @desc removes poi from state
	 * @param {number} id - poi id
	 */
	function removeFromState(id) {
		if (isPoiInState(id)) {
			delete poiObjectsState[id];
		}
	}

	/**
	 * @desc update poi in state
	 * @param {object} poi - poi object
	 */
	function updatePoiInState(poi) {
		removeFromState(poi.id);
		addToState(poi);
	}

	/**
	 * @desc return poi state
	 * @returns {object} - poi state
	 */
	function getPoiState() {
		return poiObjectsState;
	}

	/**
	 * @desc Loads poi of given category to cache and returns them
	 * @param {number} poiCategory - Id of poi category, 0 for all types
	 * @returns {NodeList} - List of DOM elements corresponding with given poi category
	 */
	function loadPoiToCache(poiCategory) {
		poiCategoriesCache[poiCategory] = doc.querySelectorAll(
			(poiCategory === 0) ?
				'.leaflet-marker-icon, .leaflet-marker-shadow' :
				'.point-type-' + poiCategory
		);

		return poiCategoriesCache[poiCategory];
	}

	/**
	 * @desc Deletes poi from poi cache
	 * @param {number} poiCategory - Id of point type
	 */
	function invalidatePoiCache(poiCategory) {
		delete poiCategoriesCache[poiCategory];
	}

	/**
	 * @desc resets poi cache to initial state
	 */
	function resetPoiCache() {
		poiCategoriesCache = {};
	}

	/**
	 * @desc Return DOM elements for given poi category
	 * @param {number} poiCategory - Id of poi category, 0 for all types
	 * @returns {NodeList} - List of DOM elements corresponding with given poi category
	 */
	function getPoiByCategory(poiCategory) {
		return (poiCategoriesCache.hasOwnProperty(poiCategory)) ?
			poiCategoriesCache[poiCategory] :
			loadPoiToCache(poiCategory);
	}

	return {
		setupInitialPoiState: setupInitialPoiState,
		isPoiInState: isPoiInState,
		addToState: addToState,
		getPoiState: getPoiState,
		removeFromState: removeFromState,
		invalidatePoiCache: invalidatePoiCache,
		getPoiByCategory: getPoiByCategory,
		updatePoiInState: updatePoiInState,
		resetPoiCache: resetPoiCache
	};
});
