define(
	'im.pontoCommunicationAPI',
	['ponto', 'im.config', 'im.pontoCommunicationAPI.utils', 'im.map'],
	function (ponto, config, apiUtils, mapModule) {
		'use strict';

		var apiConfig = config.pontoCommunicationAPI,
			map,
			mapBoundaries,
			playerMarker;

		/**
		 * @desc Ponto scope object with communication API with map in web view / iframe
		 * @constructor
		 */
		function PontoCommunicationAPI() {
			map = mapModule.getMapObject();
			mapBoundaries = mapModule.getMapBoundaries();

			/**
			 * @desc sets position of player location
			 * @param {Object} params - coordinates and zoom level for player position, example:
			 *     {
			 *         lat: [Number],
			 *         lng: [Number],
			 *         zoom: [Number=], // "centerMap" set to "true" is required
			 *         centerMap: [Boolean=]
			 *     }
			 * @param {Number} callbackId - ponto callback ID
			 */
			this.setPlayerCurrentLocation = function (params, callbackId) {
				var validationResult = apiUtils.validateParams(params, mapBoundaries),
					latLng,
					errorCode,
					responseContent;

				if (validationResult.success) {
					latLng = apiUtils.createLatLng(params.lat, params.lng);

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
						apiUtils.updateMapPosition(map, latLng, params.zoom);
					}
				} else {
					errorCode = apiConfig.responseCodes.invalidParams;
					responseContent = {
						maxZoom: config.mapConfig.max_zoom,
						minZoom: config.mapConfig.min_zoom
					};

					if (mapBoundaries) {
						responseContent.boundaries = mapBoundaries;
					}
				}
				ponto.respond(
					apiUtils.createPontoResponse(
						validationResult.success,
						errorCode || apiConfig.responseCodes.success,
						validationResult.errorMessage || apiConfig.responseMessages.setPlayerLocation,
						responseContent
					), callbackId);
			};

			/**
			 * @desc removes player location marker from map
			 * @param {Object} params - params sent via ponto
			 * @param {Number} callbackId - ponto callback ID
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

			/**
			 * @desc updates Map position and its zoom level
			 * @param {Object} params - params sent via ponto
			 * @param {Number} callbackId - ponto callback ID
			 */

			this.updateMapPosition = function (params, callbackId) {
				var validationResult = apiUtils.validateParams(params, mapBoundaries),
					latLng,
					errorCode,
					responseContent;

				if (validationResult.success) {
					latLng = apiUtils.createLatLng(params.lat, params.lng);
					apiUtils.updateMapPosition(map, latLng, params.zoom);
				} else {
					errorCode = apiConfig.responseCodes.invalidParams;
					responseContent = {
						maxZoom: config.mapConfig.max_zoom,
						minZoom: config.mapConfig.min_zoom
					};
				}

				ponto.respond(
					apiUtils.createPontoResponse(
						validationResult.success,
						errorCode || apiConfig.responseCodes.success,
						validationResult.errorMessage || apiConfig.responseMessages.updatedMapPosition,
						responseContent
					), callbackId);
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
