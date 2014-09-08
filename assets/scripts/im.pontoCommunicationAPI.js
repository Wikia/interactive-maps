define(
	'im.pontoCommunicationAPI',
	['ponto', 'im.config', 'im.leafletWrapper', 'im.pontoCommunicationAPI.utils', 'im.map'],
	function (ponto, config, L, apiUtils, mapModule) {
		'use strict';

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
			this.setPlayerCurrentLocation = function (params, callbackId) {
				var responseMessage = apiConfig.responseMessages.setPlayerLocation,
					mapBoundaries = mapModule.getMapBoundaries(),
					validationResult = apiUtils.validateParams(params, mapBoundaries),
					responseCode = apiConfig.responseCodes.success,
					responseContent = {},
					latLng;

				if (validationResult.success) {
					latLng = L.latLng(params.lat, params.lng);

					if (!map.hasLayer(playerMarker)) {
						playerMarker = apiUtils.createPlayerMarker({
							lat: params.lat,
							lon: params.lng
						});
						playerMarker.addTo(map);
					} else {
						apiUtils.updatePlayerMarkerLocation(playerMarker, latLng);
					}

					if (params.centerMap) {
						apiUtils.centerMapToPlayerLocation(map, latLng, params.zoom);
					}
				} else {
					responseMessage = validationResult.message;
					responseCode = apiConfig.responseCodes.invalidParams;
					responseContent.boundaries = mapBoundaries;
				}

				ponto.respond(
					apiUtils.createPontoResponse(
						validationResult.success, responseCode, responseMessage, responseContent
					), callbackId);
			};

			/**
			 * @desc removes player location marker from map
			 * @param {object} params - params sent via ponto
			 * @param {number} callbackId - ponto callback ID
			 */
			this.removePlayerLocation = function (params, callbackId) {
				map.removeLayer(playerMarker);

				ponto.respond(
					apiUtils.createPontoResponse(
						true,
						apiConfig.responseCodes.success,
						apiConfig.responseMessages.removePlayerLocation
					),
					callbackId
				);
			};
		}

		// PontoBaseHandler extension pattern - check Ponto documentation for details
		ponto.PontoBaseHandler.derive(PontoCommunicationAPI);
		PontoCommunicationAPI.getInstance = function () {
			return new PontoCommunicationAPI();
		};

		return PontoCommunicationAPI;
	}
);
