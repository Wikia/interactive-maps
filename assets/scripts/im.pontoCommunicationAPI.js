'use strict';

define(
	'im.pontoCommunicationAPI',
	['ponto', 'im.config', 'im.leafletWrapper', 'im.poi', 'im.map'],
	function (ponto, config, L, poiModule, mapModule) {
		var apiConfig = config.pontoCommunicationAPI,
			playerMarker,
			map;

		/**
		 * @desc Ponto scope object with communication API with map in web view / iframe
		 * @constructor
		 */
		function PontoCommunicationAPI() {
			// set reference to map object
			map = mapModule.getMapObject();

			/**
			 * @desc sets position of player location
			 * @param {object} params - coordinates and zoom level for player position, example:
			 *     {
			 *         lat: [Number],
			 *         lng: [Number],
			 *         zoom: [Number=], // "centerMap" set to "true" is required
			 *         centerMap: [Boolean=]
			 *     }
			 * @param {number} callbackId - ponto callback ID
			 */
			this.setPlayerCurrentLocation = function(params, callbackId) {
				var responseMessage = apiConfig.responseMessages.setPlayerLocation,
					validationResult = validateParams(params),
					responseCode = apiConfig.responseCodes.success,
					latLng;

				if (validationResult.success) {
					latLng = L.latLng(params.lat, params.lng);

					if (!map.hasLayer(playerMarker)) {
						createPlayerMarker({
							lat: params.lat,
							lon: params.lng
						});
					} else {
						updatePlayerMarkerLocation(latLng);
					}

					if (params.centerMap) {
						centerMapToPlayerLocation(latLng, params.zoom);
					}
				} else {
					responseMessage = validationResult.message;
					responseCode = apiConfig.responseCodes.invalidParams;
				}

				ponto.respond(
					createPontoResponse(
						validationResult.success, responseCode, responseMessage, mapModule.getMapBoundaries()
					), callbackId);
			};

			/**
			 * @desc removes player location marker from map
			 * @param {object} params - params sent via ponto
			 * @param {number} callbackId - ponto callback ID
			 */
			this.removePlayerLocation = function(params, callbackId) {
				var responseMessage = apiConfig.responseMessages.removePlayerLocation;

				map.removeLayer(playerMarker);

				ponto.respond(createPontoResponse(true, apiConfig.responseCodes.success, responseMessage), callbackId);
			};
		}

		// HELPER METHODS *****************************************************************

		/**
		 * @desc creates ponto response object
		 * @param {Boolean} success
		 * @param {Number} responseCode
		 * @param {String} message - response message
		 * @param {Object=} content - additional data
		 * @returns {Object}
		 */
		function createPontoResponse(success, responseCode, message, content) {
			return {
				success: success,
				responseCode: responseCode,
				message: message,
				content: content || {}
			};
		}

		/**
		 * @desc helper function that validates player location params
		 * @param {Object} params - params sent via ponto
		 */
		function validateParams(params) {
			var mapBoundaries = mapModule.getMapBoundaries(),
				result = {
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
			return lat < bounds.north &&
				lat > bounds.south &&
				lng > bounds.west &&
				lng < bounds.east;
		}

		/**
		 * @desc helper function that creates marker for player location and adds it to map
		 * @param {object} params
		 */
		function createPlayerMarker(params) {
			var markerSize = apiConfig.defaultMarkerSize;

			playerMarker = poiModule.createPoiMarker(
				params,
				L.icon({
					iconUrl: apiConfig.defaultPlayerIcon,
					iconSize: [markerSize, markerSize]
				})
			);
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

		// END OF HELPER METHODS *******************************************************************

		// PontoBaseHandler extension pattern - check Ponto documentation for details
		ponto.PontoBaseHandler.derive(PontoCommunicationAPI);
		PontoCommunicationAPI.getInstance = function() {
			return new PontoCommunicationAPI();
		};

		return PontoCommunicationAPI;
	}
);
