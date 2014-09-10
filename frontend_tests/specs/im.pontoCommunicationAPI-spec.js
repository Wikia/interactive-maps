'use strict';

describe('im.pontoCommunicationAPI', function () {
	var ponto = {
			PontoBaseHandler: jasmine.createSpyObj('PontoBaseHandler', ['derive']),
			respond: function () {}
		},
		config = {
			mapConfig: {
				max_zoom: 1,
				min_zoom: 0
			},
			pontoCommunicationAPI: {
				responseMessages: {
					setPlayerLocation: 'Player location set successfully',
					removePlayerLocation: 'Player location removed from map successfully',
					invalidParamTypes: 'Wrong parameters types'
				},
				responseCodes: {
					success: 200,
					invalidParams: 422
				}
			}
		},
		playerMarkerMock = jasmine.createSpyObj('playerMarkerMock', ['addTo']),
		mapMock = {
			removeLayer: function() {},
			hasLayer: function() {}
		},
		apiUtils = {
			createPontoResponse: function () {},
			validateParams: function () {},
			createPlayerMarker: function () {
				return playerMarkerMock;
			},
			createLatLng: function () {},
			updatePlayerMarkerLocation: function () {}
		},
		mapModule = {
			getMapObject: function() {
				return mapMock;
			},
			getMapBoundaries: function() {}
		},
		PontoAPI = modules['im.pontoCommunicationAPI'](ponto, config, apiUtils, mapModule);


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
			callbackId = 1,
			validationResult = {
				success: true
			};

		spyOn(apiUtils, 'validateParams').andReturn(validationResult);
		spyOn(mapMock, 'hasLayer').andReturn(false);
		spyOn(apiUtils, 'createPlayerMarker').andCallThrough();
		spyOn(apiUtils, 'createPontoResponse');

		PontoAPI.getInstance().setPlayerCurrentLocation(requestParams, callbackId);

		expect(apiUtils.createPlayerMarker).toHaveBeenCalledWith(createMarkerParams);
		expect(playerMarkerMock.addTo).toHaveBeenCalledWith(mapMock);
		expect(apiUtils.createPontoResponse).toHaveBeenCalledWith(
			true,
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
			callbackId = 1,
			validationResult = {
				success: true
			},
			latLng = {};

		spyOn(apiUtils, 'validateParams').andReturn(validationResult);
		spyOn(mapMock, 'hasLayer').andReturn(true);
		spyOn(apiUtils, 'updatePlayerMarkerLocation');
		spyOn(apiUtils, 'createLatLng').andReturn(latLng);
		spyOn(apiUtils, 'createPontoResponse');

		PontoAPI.getInstance().setPlayerCurrentLocation(requestParams, callbackId);

		expect(apiUtils.createLatLng).toHaveBeenCalledWith(requestParams.lat, requestParams.lng);
		expect(apiUtils.updatePlayerMarkerLocation).toHaveBeenCalled();
		expect(apiUtils.updatePlayerMarkerLocation.mostRecentCall.args[1]).toBe(latLng);
		expect(apiUtils.createPontoResponse).toHaveBeenCalledWith(
			true,
			config.pontoCommunicationAPI.responseCodes.success,
			config.pontoCommunicationAPI.responseMessages.setPlayerLocation,
			undefined
		);
	});

	it('Sends success false response for setPlayerCurrentLocation', function () {
		var requestParams = {
				lat: 1,
				lng: 1
			},
			callbackId = 1,
			validationResult = {
				success: false,
				errorMessage: config.pontoCommunicationAPI.responseMessages.invalidParamTypes
			},
			boundaries = {},
			responseContent = {
				boundaries: boundaries,
				maxZoom: config.mapConfig.max_zoom,
				minZoom: config.mapConfig.min_zoom
			};

		spyOn(apiUtils, 'validateParams').andReturn(validationResult);
		spyOn(apiUtils, 'createPontoResponse');
		spyOn(mapModule, 'getMapBoundaries').andReturn(boundaries);

		PontoAPI.getInstance().setPlayerCurrentLocation(requestParams, callbackId);

		expect(apiUtils.createPontoResponse).toHaveBeenCalledWith(
			false,
			config.pontoCommunicationAPI.responseCodes.invalidParams,
			config.pontoCommunicationAPI.responseMessages.invalidParamTypes,
			responseContent
		);
	});

	it('Removes player location from map', function () {
		var callbackId = 1,
			pontoResponse = 'test';

		spyOn(mapMock, 'removeLayer');
		spyOn(ponto, 'respond');
		spyOn(apiUtils, 'createPontoResponse').andReturn(pontoResponse);

		PontoAPI.getInstance().removePlayerLocation(null, callbackId);

		expect(mapMock.removeLayer).toHaveBeenCalled();
		expect(apiUtils.createPontoResponse).toHaveBeenCalledWith(
			true,
			config.pontoCommunicationAPI.responseCodes.success,
			config.pontoCommunicationAPI.responseMessages.removePlayerLocation
		);
		expect(ponto.respond).toHaveBeenCalledWith(apiUtils.createPontoResponse(), callbackId);
	});
});
