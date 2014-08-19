'use strict';

define('im.poiCategory', ['im.leafletWrapper', 'im.config'], function (L, config) {
	// id of uneditable poi category (Other)
	var catchAllCategoryId = config.mapConfig.catchAllCategoryId,
		// placeholder for array with editable poi categories
		editablePoiCategories,
		// placeholder for array with uneditable poi categories
		unEditablePoiCategories,
		poiCategoryIcons = {};

	/**
	 * @desc Setup icon for markers with given point type
	 * @param {object} poiCategory - POI type object
	 */
	function setupPoiCategoryIcon(poiCategory) {
		var poiCategoryIcon;

		if (!poiCategory.marker && !poiCategory.no_marker) {
			poiCategoryIcon = createCustomPoiCategoryIcon(poiCategory);
		} else {
			poiCategoryIcon = createDefaultPoiCategoryIcon(poiCategory);
		}

		// extend poi category icon object
		L.setOptions(poiCategoryIcon, {
			className: 'point-type-' + poiCategory.id
		});

		// store icon object
		poiCategoryIcons[poiCategory.id] = poiCategoryIcon;
	}

	/**
	 * @desc creates custom poi category icon
	 * @param {object} poiCategory
	 * @returns {object} - leaflet icon object
	 */
	function createCustomPoiCategoryIcon(poiCategory) {
		return L.icon({
			iconUrl: poiCategory.marker,
			iconSize: [config.poiIconWidth, config.poiIconHeight]
		});
	}

	/**
	 * @desc creates default poi category icon
	 * @param {object} poiCategory
	 * @returns {object} - leaflet icon object
	 */
	function createDefaultPoiCategoryIcon(poiCategory) {
		var poiCategoryIcon = new L.Icon.Default();

		// this is the nicest way to do that I found
		// we need to overwrite it here so in the filter box we have not broken image
		poiCategory.marker = poiCategoryIcon._getIconUrl('icon');

		// we need this one for edit POI categories popup
		poiCategory.no_marker = true;

		return poiCategoryIcon;
	}

	/**
	 * @desc returns poi category icon
	 * @param {number} id - poi category id
	 * @returns {string} - icon URL
	 */
	function getPoiCategoryIcon(id) {
		return poiCategoryIcons[id];
	}

	/**
	 * @desc initial setup of poi categories
	 * @param {Array} poiCategories
	 */
	function setupPoiCategories(poiCategories) {
		setEditablePoiCategories(poiCategories);
		setUnEditablePoiCategories(poiCategories);
	}

	/**
	 * @desc sets editable poi categories
	 * @param {Array} poiCategories
	 */
	function setEditablePoiCategories(poiCategories) {
		editablePoiCategories = poiCategories.filter(function (category) {
			return category.id !== catchAllCategoryId;
		});
	}

	/**
	 * @desc Filters out POI categories that should not be edited and caches the result to editablePoiCategories
	 * @returns {Array} - editable poi categories
	 */
	function getEditablePoiCategories() {
		return editablePoiCategories;
	}

	/**
	 * @desc sets uneditable poi categories
	 * @param {Array} poiCategories
	 */
	function setUnEditablePoiCategories(poiCategories) {
		unEditablePoiCategories = poiCategories.filter(function (category) {
			return category.id === catchAllCategoryId;
		});
	}

	/**
	 * @desc Filters POI categories that should not be edited and caches the result to unEditablePoiCategories
	 * @returns {Array} - editable poi categories
	 */
	function getUnEditablePoiCategories() {
		return unEditablePoiCategories;
	}

	/**
	 * @desc returns all poi categories
	 * @returns {Array}
	 */
	function getAllPoiCategories() {
		return getEditablePoiCategories().concat(getUnEditablePoiCategories());
	}

	return {
		setupPoiCategoryIcon: setupPoiCategoryIcon,
		getEditablePoiCategories: getEditablePoiCategories,
		getUnEditablePoiCategories: getUnEditablePoiCategories,
		getPoiCategoryIcon: getPoiCategoryIcon,
		getAllPoiCategories: getAllPoiCategories,
		setEditablePoiCategories: setEditablePoiCategories,
		setupPoiCategories: setupPoiCategories
	};
});
