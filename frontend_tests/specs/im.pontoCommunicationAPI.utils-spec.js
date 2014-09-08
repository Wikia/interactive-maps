'use strict';

describe('im.pontoCommunicationAPI.utils', function () {
	var L = jasmine.createSpyObj('L', ['icon']),
		poiModule = {
			createPoiMarker: function () {
				return true;
			}
		},
		config = {
			pontoCommunicationAPI: {
				responseMessages : {
					invalidParamTypes: '"lat" and "lng" params must be numbers',
					outOfMapBounds: 'Player location must be inside map boundaries'
				},
				defaultMarkerSize: 1,
				defaultPlayerIcon: 'test.png'
			}
		},
		apiUtils = modules['im.pontoCommunicationAPI.utils'](L, config, poiModule);

	it('Creates valid API response object', function () {
		var params = [
			{
				success: true,
				responseCode: 1,
				message: ''
			},
			{
				success: false,
				responseCode: 1,
				message: ''
			},
			{
				success: false,
				responseCode: 1,
				message: '',
				content: {}
			}
		];

		params.forEach(function (data) {
			var response = apiUtils.createPontoResponse(data.success, data.responseCode, data.message, data.content);

			expect(response.success).toBe(data.success);
			expect(response.responseCode).toBe(data.responseCode);
			expect(response.message).toBe(data.message);
			expect(
				typeof response.content === 'object' ||
				typeof response.content === 'undefined'
			).toBe(true);
		});
	});

	it('Adds content object passed as function param to ponto response object', function () {
		var params = {
				success: true,
				responseCode: 1,
				message: '',
				content: {
					test: 123
				}
			},
			response = apiUtils.createPontoResponse(
				params.success,
				params.responseCode,
				params.message,
				params.content
			);

		expect(response.content).toBe(params.content);
	});

	it('Throws error when invalid params are passed to createPontoResponse function', function () {
		var params = [
			{
				success: null,
				responseCode: 1,
				message: ''
			},
			{
				success: true,
				responseCode: null,
				message: '',
				content: {}
			},
			{
				success: false,
				responseCode: 1,
				message: null
			},
			{
				success: true,
				responseCode: 1,
				message: '',
				content: null
			}
		];

		params.forEach(function (data) {
			expect(function () {
				return apiUtils.createPontoResponse(data.success, data.responseCode, data.message, data.content);
			}).toThrow('Invalid function params');
		});
	});

	it('fails params validation - wrong params types', function () {
		var params = [
			{
				lat: '',
				lng: 1
			},
			{
				lat: 1,
				lng: ''
			}
		];

		params.forEach(function (data) {
			var result = apiUtils.validateParams(data);

			expect(result.success).toBe(false);
			expect(result.message).toBe(config.pontoCommunicationAPI.responseMessages.invalidParamTypes);
		});
	});

	it('fails params validation - location out of map boundaries', function () {
		var bounds = {
				north: 1,
				south: -1,
				west: -1,
				east: 1
			},
			params = [
				{
					lat: 2,
					lng: 0
				},
				{
					lat: -2,
					lng: 0
				},
				{
					lat: 0,
					lng: 2
				},
				{
					lat: 0,
					lng: -2
				}
			];

		params.forEach(function (data) {
			var result = apiUtils.validateParams(data, bounds);

			expect(result.success).toBe(false);
			expect(result.message).toBe(config.pontoCommunicationAPI.responseMessages.outOfMapBounds);
		});
	});

	it('Creates player marker', function () {
		var params = {},
			iconParams = {
				iconUrl: config.pontoCommunicationAPI.defaultPlayerIcon,
				iconSize: [
					config.pontoCommunicationAPI.defaultMarkerSize,
					config.pontoCommunicationAPI.defaultMarkerSize
				]
			},
			marker,
			returnValue = true;

		spyOn(poiModule, 'createPoiMarker').andReturn(returnValue);

		marker = apiUtils.createPlayerMarker(params);

		expect(marker).toBe(returnValue);
		expect(poiModule.createPoiMarker).toHaveBeenCalledWith(params, L.icon());
		expect(L.icon).toHaveBeenCalledWith(iconParams);
	});

	it('Updates player position', function () {
		var playerMarker = jasmine.createSpyObj('playerMarker', ['setLatLng']),
			latLng = {};

		apiUtils.updatePlayerMarkerLocation(playerMarker, latLng);

		expect(playerMarker.setLatLng).toHaveBeenCalledWith(latLng);
	});

	it('Centers map to player location', function () {
		var map = jasmine.createSpyObj('map', ['setView']),
			latLng = {},
			zoom = 0;

		apiUtils.centerMapToPlayerLocation(map, latLng, zoom);

		expect(map.setView).toHaveBeenCalledWith(latLng, zoom);
	});
});
