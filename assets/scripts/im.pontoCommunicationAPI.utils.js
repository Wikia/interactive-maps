define(
	'im.pontoCommunicationAPI.utils',
	['im.leafletWrapper', 'im.config', 'im.poi'],
	function (L, config, poiModule) {
		'use strict';

		var apiConfig = config.pontoCommunicationAPI;

		/**
		 * @desc creates ponto response object
		 * @param {Boolean} success
		 * @param {Number} responseCode
		 * @param {String} message - response message
		 * @param {Object=} content - additional data
		 * @returns {Object}
		 */
		function createPontoResponse(success, responseCode, message, content) {
			var response = {};

			if (
				typeof success !== 'boolean' ||
				typeof responseCode !== 'number' ||
				typeof message !== 'string' ||
				typeof content !== 'object' && typeof content !== 'undefined' || content === null
				) {
				throw new Error('Invalid function params');
			}

			response.success = success;
			response.responseCode = responseCode;
			response.message = message;

			if (content) {
				response.content = content;
			}

			return response;
		}

		/**
		 * @desc helper function that validates player location params
		 * @param {Object} params - params sent via ponto
		 * @param {Object=} mapBoundaries -  map boundaries
		 */
		function validateParams(params, mapBoundaries) {
			var result = {
					success: false
				};

			if (!validateTypes(params)) {
				result.message = apiConfig.responseMessages.invalidParamTypes;
			} else if (mapBoundaries && !isPlayerLocationInMapBounds(mapBoundaries, params.lat, params.lng)) {
				result.message = apiConfig.responseMessages.outOfMapBounds;
			} else {
				result.success = true;
			}

			return result;
		}

		/**
		 * @desc validates params types
		 * @param {Object} params - params sent via ponto
		 * @returns {boolean}
		 */
		function validateTypes(params) {
			return typeof params.lat === 'number' && typeof params.lng === 'number';
		}

		/**
		 * @desc checks if player location fits in map boundaries
		 * @param {Object} bounds - map boundaries
		 * @param {Number} lat - latitude
		 * @param {Number} lng - longitude
		 * @returns {boolean}
		 */
		function isPlayerLocationInMapBounds(bounds, lat, lng) {
			return lat <= bounds.north &&
				lat >= bounds.south &&
				lng >= bounds.west &&
				lng <= bounds.east;
		}

		/**
		 * @desc helper function that creates marker for player location and adds it to map
		 * @param {Object} params
		 */
		function createPlayerMarker(params) {
			var markerSize = apiConfig.defaultMarkerSize;

			return poiModule.createPoiMarker(
				params,
				L.icon({
					iconUrl: apiConfig.defaultPlayerIcon,
					iconSize: [markerSize, markerSize]
				})
			);
		}

		/**
		 * @desc helper function that updates player marker location
		 * @param {Object} playerMarker - leaflet marker object
		 * @param {Object} latLng - latLng Leaflet object
		 */
		function updatePlayerMarkerLocation(playerMarker, latLng) {
			playerMarker.setLatLng(latLng);
		}

		/**
		 * @desc helper function that centers map and sets its zoom level to player current location
		 * @param {Object} map - leaflet map object
		 * @param {Object} latLng - latLng Leaflet object
		 * @param {Number} zoom - map zoom level
		 */
		function centerMapToPlayerLocation(map, latLng, zoom) {
			map.setView(latLng, zoom);
		}

		return {
			createPontoResponse: createPontoResponse,
			validateParams: validateParams,
			createPlayerMarker: createPlayerMarker,
			updatePlayerMarkerLocation: updatePlayerMarkerLocation,
			centerMapToPlayerLocation: centerMapToPlayerLocation
		};
	}
);
