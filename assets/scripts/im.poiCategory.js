'use strict';

define('im.poiCategory', ['im.leafletWrapper', 'im.config'], function (L, config) {
	var editablePoiCategories;

	/**
	 * @desc Setup icon for markers with given point type
	 * @param {object} poiCategory - POI type object
	 * @param {object} poiCategoryIcons - object with leaflet marker icons
	 */
	function setupPoiCategoryIcon(poiCategory, poiCategoryIcons) {
		var poiCategoryIcon;

		if (poiCategory.marker !== null) {
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
	 * @desc Filters out POI categories that should not be edited and caches the result uses editablePinTypes for caching
	 * @param {array} poiCategories
	 * @returns {array} - editable poi categories
	 */
	function getEditablePoiCategories(poiCategories) {
		return (editablePoiCategories) ?
			editablePoiCategories :
			editablePoiCategories = poiCategories.filter(function (cat) {
				return cat.id !== window.mapSetup.catchAllCategoryId;
			});
	}

	return {
		setupPoiCategoryIcon: setupPoiCategoryIcon,
		getEditablePoiCategories: getEditablePoiCategories
	};
});
