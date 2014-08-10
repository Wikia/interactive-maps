'use strict';

define('im.poiCategory', ['im.leafletWrapper', 'im.config'], function (L, config) {
	var catchAllCategoryId = config.mapConfig.catchAllCategoryId,
		editablePoiCategories,
		unEditablePoiCategories,
		poiCategoryIcons = {};

	/**
	 * @desc Setup icon for markers with given point type
	 * @param {object} poiCategory - POI type object
	 */
	function setupPoiCategoryIcon(poiCategory) {
		var poiCategoryIcon;

		if (poiCategory.marker !== null && !poiCategory.no_marker) {
			poiCategoryIcon = L.icon({
				iconUrl: poiCategory.marker,
				iconSize: [config.poiIconWidth, config.poiIconHeight]
			});
		} else {
			poiCategoryIcon = new L.Icon.Default();
			// this is the nicest way to do that I found
			// we need to overwrite it here so in the filter box we have not broken image
			poiCategory.marker = poiCategoryIcon._getIconUrl('icon');

			// we need this one for edit POI categories popup
			poiCategory.no_marker = true;
		}

		L.setOptions(poiCategoryIcon, {
			className: 'point-type-' + poiCategory.id
		});

		poiCategoryIcons[poiCategory.id] = poiCategoryIcon;
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
	 * @desc Filters out POI categories that should not be edited and caches the result to editablePoiCategories
	 * @param {array} poiCategories
	 * @returns {array} - editable poi categories
	 */
	function getEditablePoiCategories(poiCategories) {
		return (editablePoiCategories) ?
			editablePoiCategories :
			editablePoiCategories = poiCategories.filter(function (category) {
				return category.id !== catchAllCategoryId;
			});
	}

	/**
	 * @desc updates editable pos categories
	 * @param {araay} poiCategories
	 */
	function updateEditablePoiCategories(poiCategories) {
		editablePoiCategories = poiCategories;
	}

	/**
	 * @desc Filters POI categories that should not be edited and caches the result to unEditablePoiCategories
	 * @returns {array} - editable poi categories
	 */
	function getUnEditablePoiCategories() {
		return (unEditablePoiCategories) ?
			unEditablePoiCategories :
			unEditablePoiCategories = config.mapConfig.types.filter(function (category) {
			return category.id === catchAllCategoryId;
		});
	}

	return {
		setupPoiCategoryIcon: setupPoiCategoryIcon,
		getEditablePoiCategories: getEditablePoiCategories,
		getUnEditablePoiCategories: getUnEditablePoiCategories,
		updateEditablePoiCategories: updateEditablePoiCategories,
		getPoiCategoryIcon: getPoiCategoryIcon
	};
});
