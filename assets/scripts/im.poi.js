'use strict';

define('im.poi', ['im.leafletWrapper', 'im.config', 'im.renderUI', 'im.i18n'], function (L, config, renderUI, i18n) {
	/**
	 * @desc Creates POI marker
	 * @param {object} poi - POI object
	 * @param {string} icon - icon URL
	 * @returns {object} - leaflet marker object
	 */
	function createPoiMarker(poi, icon) {
		return L.marker([poi.lat, poi.lon], {
			icon: icon,
			riseOnHover: true,
			type: poi.type
		});
	}

	/**
	 * @desc creates temporary POI leaflet marker - required for adding new POI to map
	 * @param {Event} event
	 * @returns {object} temporary leaflet marker object
	 */
	function createTempPoiMarker(event) {
		var marker = event.layer,
			latLng = marker.getLatLng();

		marker.point = {
			lat: latLng.lat,
			lon: latLng.lng
		};

		return marker;
	}

	/**
	 * @desc Creates POI popup
	 * @param {object} poi - POI object
	 * @param {number} popupWidth - width of the popup
	 * @returns {object} - leaflet popup object
	 */
	function createPoiPopup(poi, popupWidth) {
		var popup = L.popup({
			closeButton: false,
			minWidth: popupWidth,
			maxWidth: popupWidth,
			keepInView: true
		});

		popup.setContent(renderUI.buildPopupHtml(poi, i18n.msg('wikia-interactive-maps-edit-poi')));

		return popup;
	}

	/**
	 * @desc Add point to the map
	 * @param {object} poi - POI object
	 * @param {string} icon - icon URL
	 * @param {object} markers - leaflet markers layer group
	 * @returns {object} - marker object
	 */
	function addPoiToMap(poi, icon, markers) {
		var popupWidth = (poi.photo) ? config.popupWidthWithPhoto : config.popupWidthWithoutPhoto,
			marker = createPoiMarker(poi, icon),
			popup;

		// adding marker to markers layer group creates leaflet id for a marker
		marker.addTo(markers);

		// extend point data with marker leaflet id
		poi.leafletId = marker._leaflet_id;
		popup = createPoiPopup(poi, popupWidth);
		marker.bindPopup(popup);

		// extend marker object with point data;
		marker.point = poi;

		return marker;
	}

	/**
	 * @desc get marker from markers layer group
	 * @param {object} markers - leaflet markers layer group
	 * @param {string} id - leaflet markers id
	 * @returns {object} - marker object
	 */
	function getPoiMarker(markers, id) {
		return markers.getLayer(id);
	}

	return {
		addPoiToMap: addPoiToMap,
		createTempPoiMarker: createTempPoiMarker,
		getPoiMarker: getPoiMarker
	};
});
