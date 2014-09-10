'use strict';

describe('im.pontoCommunicationAPI', function () {
	var ponto = {
			respond: jasmine.createSpy('respond'),
			PontoBaseHandler: jasmine.createSpyObj('PontoBaseHandler', ['derive'])
		},
		pontoCallbackId = 1,
		config = {
			mapConfig: {
				max_zoom: 1,
				min_zoom: 0
			},
			pontoCommunicationAPI: {
				responseMessages: {
					setPlayerLocation: 'Player location set successfully',
					removePlayerLocation: 'Player location removed from map successfully',
					invalidParamTypes: 'Wrong parameters types',
					updatedMapPosition: 'Map position updated successfully'
				},
				responseCodes: {
					success: 200,
					invalidParams: 422
				}
			}
		},
		playerMarkerMock = jasmine.createSpyObj('playerMarkerMock', ['addTo']),
		mapMock = {
			removeLayer: jasmine.createSpy('removeLayer'),
			hasLayer: jasmine.createSpy('hasLayer')
		},
		pontoResponseMock = {},
		latLngMock = {},
		apiUtils = {
			createPontoResponse: jasmine.createSpy('createPontoResponse').andReturn(pontoResponseMock),
			validateParams: function () {},
			createPlayerMarker: function () {
				return playerMarkerMock;
			},
			createLatLng: jasmine.createSpy('createLatLng').andReturn(latLngMock),
			updatePlayerMarkerLocation: jasmine.createSpy('updatePlayerMarkerLocation'),
			updateMapPosition: jasmine.createSpy('updateMapPosition')
		},
		mapModule = {
			getMapObject: function() {
				return mapMock;
			},
			getMapBoundaries: function() {}
		},
		PontoAPI = modules['im.pontoCommunicationAPI'](ponto, config, apiUtils, mapModule);

	/**
	 * @desc helper function for spying on validateParams with return value
	 * @param {Boolean} success
	 */
	function paramsValidationSpyHelper(success) {
		var result = {
			success: success
		};

		if (!success) {
			result.errorMessage = config.pontoCommunicationAPI.responseMessages.invalidParamTypes;
		}

		spyOn(apiUtils, 'validateParams').andReturn(result);

		return result;
	}

	it('Creates Ponto Communication API', function () {
		var api = PontoAPI.getInstance();

		expect(typeof PontoAPI).toBe('function');
		expect(ponto.PontoBaseHandler.derive).toHaveBeenCalledWith(PontoAPI);
		expect(typeof PontoAPI.getInstance).toBe('function');
		expect(api instanceof PontoAPI).toBe(true);
		expect(typeof api.setPlayerCurrentLocation).toBe('function');
		expect(typeof api.removePlayerLocation).toBe('function');
		expect(typeof api.updateMapPosition).toBe('function');
	});

	it('Sets player location on map', function() {
		var requestParams = {
				lat: 1,
				lng: 1
			},
			createMarkerParams = {
				lat: requestParams.lat,
				lon: requestParams.lng
			},
			validationResult = paramsValidationSpyHelper(true);


		mapMock.hasLayer.andReturn(false);
		spyOn(apiUtils, 'createPlayerMarker').andCallThrough();

		PontoAPI.getInstance().setPlayerCurrentLocation(requestParams, pontoCallbackId);

		expect(apiUtils.createPlayerMarker).toHaveBeenCalledWith(createMarkerParams);
		expect(playerMarkerMock.addTo).toHaveBeenCalledWith(mapMock);
		expect(apiUtils.createPontoResponse).toHaveBeenCalledWith(
			validationResult.success,
			config.pontoCommunicationAPI.responseCodes.success,
			config.pontoCommunicationAPI.responseMessages.setPlayerLocation,
			undefined
		);
	});

	it('Updates player location on map', function () {
		var requestParams = {
				lat: 1,
				lng: 1
			},
			validationResult = paramsValidationSpyHelper(true);

		mapMock.hasLayer.andReturn(true);

		PontoAPI.getInstance().setPlayerCurrentLocation(requestParams, pontoCallbackId);

		expect(apiUtils.createLatLng).toHaveBeenCalledWith(requestParams.lat, requestParams.lng);
		expect(apiUtils.updatePlayerMarkerLocation).toHaveBeenCalled();
		expect(apiUtils.updatePlayerMarkerLocation.mostRecentCall.args[1]).toBe(latLngMock);
		expect(apiUtils.createPontoResponse).toHaveBeenCalledWith(
			validationResult.success,
			config.pontoCommunicationAPI.responseCodes.success,
			config.pontoCommunicationAPI.responseMessages.setPlayerLocation,
			undefined
		);
		expect(ponto.respond).toHaveBeenCalledWith(pontoResponseMock, pontoCallbackId);

	});

	it('Sends success false response for setPlayerCurrentLocation', function () {
		var requestParams = {
				lat: 1,
				lng: 1
			},
			validationResult = paramsValidationSpyHelper(false),
			boundaries = {},
			responseContent = {
				boundaries: boundaries,
				maxZoom: config.mapConfig.max_zoom,
				minZoom: config.mapConfig.min_zoom
			};

		spyOn(mapModule, 'getMapBoundaries').andReturn(boundaries);

		PontoAPI.getInstance().setPlayerCurrentLocation(requestParams, pontoCallbackId);

		expect(apiUtils.createPontoResponse).toHaveBeenCalledWith(
			validationResult.success,
			config.pontoCommunicationAPI.responseCodes.invalidParams,
			validationResult.errorMessage,
			responseContent
		);
		expect(ponto.respond).toHaveBeenCalledWith(pontoResponseMock, pontoCallbackId);
	});

	it('Removes player location from map', function () {
		PontoAPI.getInstance().removePlayerLocation(null, pontoCallbackId);

		expect(mapMock.removeLayer).toHaveBeenCalled();
		expect(apiUtils.createPontoResponse).toHaveBeenCalledWith(
			true,
			config.pontoCommunicationAPI.responseCodes.success,
			config.pontoCommunicationAPI.responseMessages.removePlayerLocation
		);
		expect(ponto.respond).toHaveBeenCalledWith(pontoResponseMock, pontoCallbackId);
	});

	it('Updates Map position', function () {
		var api = PontoAPI.getInstance(),
			requestParams = [
				{
					lat: 1,
					lng: 1
				},
				{
					lat: 1,
					lng: 1,
					zoom: 1
				}
			],
			validationResult = paramsValidationSpyHelper(true);

		requestParams.forEach( function (data) {
			api.updateMapPosition(data, pontoCallbackId);

			expect(apiUtils.createLatLng).toHaveBeenCalledWith(data.lat, data.lng);
			expect(apiUtils.updateMapPosition).toHaveBeenCalledWith(mapMock, latLngMock, data.zoom);
			expect(apiUtils.createPontoResponse).toHaveBeenCalledWith(
				validationResult.success,
				config.pontoCommunicationAPI.responseCodes.success,
				config.pontoCommunicationAPI.responseMessages.updatedMapPosition,
				undefined
			);
			expect(ponto.respond).toHaveBeenCalledWith(pontoResponseMock, pontoCallbackId);
		});
	});

	it('fails to update Map position - params validation failed', function () {
		var params = {},
			validationResult = paramsValidationSpyHelper(false),
			responseContent = {
				maxZoom: config.mapConfig.max_zoom,
				minZoom: config.mapConfig.min_zoom
			};

		PontoAPI.getInstance().updateMapPosition(params, pontoCallbackId);

		expect(apiUtils.createPontoResponse).toHaveBeenCalledWith(
			validationResult.success,
			config.pontoCommunicationAPI.responseCodes.invalidParams,
			validationResult.errorMessage,
			responseContent
		);
	});
});
