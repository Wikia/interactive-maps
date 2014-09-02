'use strict';

define('im.pontoCommunicationAPI', ['im.config', 'im.leafletWrapper', 'im.poi'], function (config, L, poiModule) {
	var playerMarker,
		map;

	/**
	 * @desc sets position of player location
	 * @param {object} params - coordinates and zoom level for player position, example:
	 *     {
	 *         lat: [Number],
	 *         lng: [Number],
	 *         zoom: [Number=], // "centerMap" set to "true" is required
	 *         centerMap: [Boolean=]
	 *     }
	 */
	function setPlayerCurrentLocation(params) {
		validateParams(params);

		var lat = params.lat,
			lng = params.lng,
			data = {
				lat: lat,
				lon: lng
			},
			latLng = L.latLng(lat, lng);

		if (!map.hasLayer(playerMarker)) {
			createPlayerMarker(data);
		} else {
			updatePlayerMarkerLocation(latLng);
		}

		if (params.centerMap) {
			centerMapToPlayerLocation(latLng, params.zoom);
		}
	}

	/**
	 * @desc removes player location marker from map
	 */
	function removePlayerLocation() {
		map.removeLayer(playerMarker);
	}

	/**
	 * @desc helper function that validates player location params
	 * @param {object} params
	 */
	function validateParams(params) {
		if (typeof params.lat !== 'number' || typeof params.lng !== 'number') {
			throw new Error ('"lat" and "lng" params must be numbers.');
		}
	}

	/**
	 * @desc helper function that creates marker for player location and adds it to map
	 * @param {object} params
	 */
	function createPlayerMarker(params) {
		playerMarker = poiModule.createPoiMarker(params, config.playerIconURL);
		playerMarker.addTo(map);
	}

	/**
	 * @desc helper function that updates player marker location
	 * @param {object} latLng - latLng Leaflet object
	 */
	function updatePlayerMarkerLocation(latLng) {
		playerMarker.setLatLng(latLng);
	}

	/**
	 * @desc helper function that centers map and sets its zoom level to player current location
	 * @param {object} latLng - latLng Leaflet object
	 * @param {number} zoom - map zoom level
	 */
	function centerMapToPlayerLocation(latLng, zoom) {
		map.setView(latLng, zoom);
	}

	return {
		setPlayerCurrentLocation: setPlayerCurrentLocation,
		removePlayerLocation: removePlayerLocation
	};
});
