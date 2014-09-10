'use strict';

describe('im.pontoCommunicationAPI.utils', function () {
	var L = jasmine.createSpyObj('L', ['icon', 'latLng']),
		poiModule = {
			createPoiMarker: function () {
				return true;
			}
		},
		config = {
			mapConfig: {
				max_zoom: 3,
				min_zoom: 0
			},
			pontoCommunicationAPI: {
				responseMessages : {
					invalidParamTypes: 'Wrong parameters types',
					invalidZoomLevel: 'Invalid zoom level value',
					outOfMapBounds: 'Player location must be inside map boundaries'
				},
				defaultMarkerSize: 1,
				defaultPlayerIcon: 'test.png'
			}
		},
		utils = {
			isInteger: function (variable) {
				return typeof variable === 'number' && isFinite(variable) && variable % 1 === 0;
			}
		},
		apiUtils = modules['im.pontoCommunicationAPI.utils'](L, config, utils, poiModule);

	it('is module with public API', function () {
		expect(typeof apiUtils === 'object').toBe(true);
		expect(typeof apiUtils.createPontoResponse === 'function').toBe(true);
		expect(typeof apiUtils.validateParams === 'function').toBe(true);
		expect(typeof apiUtils.createPlayerMarker === 'function').toBe(true);
		expect(typeof apiUtils.updatePlayerMarkerLocation === 'function').toBe(true);
		expect(typeof apiUtils.updateMapPosition === 'function').toBe(true);
		expect(typeof apiUtils.createLatLng === 'function').toBe(true);
	});

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
				lng: 1,
				zoom: 1
			},
			{
				lat: 1,
				lng: '',
				centerMap: true
			},
			{
				lat: 1,
				lng: 1,
				zoom: ''
			},
			{
				lat: 1,
				lng: 1,
				zoom: 1.2
			},
			{
				lat: 1,
				lng: 1,
				centerMap: ''
			}
		];

		params.forEach(function (data) {
			var result = apiUtils.validateParams(data);

			expect(result.success).toBe(false);
			expect(result.errorMessage).toBe(config.pontoCommunicationAPI.responseMessages.invalidParamTypes);
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
			expect(result.errorMessage).toBe(config.pontoCommunicationAPI.responseMessages.outOfMapBounds);
		});
	});

	it('Fails params validation - invalid zoom level', function () {
		var params = [
			{
				lat: 1,
				lng: 1,
				zoom: -1
			},
			{
				lat: 1,
				lng: 1,
				zoom: 4
			}
		];

		params.forEach(function (data) {
			var result = apiUtils.validateParams(data);

			expect(result.success).toBe(false);
			expect(result.errorMessage).toBe(config.pontoCommunicationAPI.responseMessages.invalidZoomLevel);
		});
	});

	it('Passes params validation', function () {
		var bounds = {
				north: 1,
				south: -1,
				west: -1,
				east: 1
			},
			params = [
			{
				lat: 1,
				lng: 1
			},
			{
				lat: 1,
				lng: 1,
				zoom: 0,
				centerMap: true
			},
			{
				lat: 1,
				lng: 1,
				zoom: 3
			},
			{
				lat: 1,
				lng: 1,
				zoom: 2
			},
			{
				lat: 1,
				lng: 1,
				centerMap: true
			}
		];

		params.forEach(function (data) {
			var result = apiUtils.validateParams(data, bounds);

			expect(result.success).toBe(true);
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

		apiUtils.updateMapPosition(map, latLng, zoom);

		expect(map.setView).toHaveBeenCalledWith(latLng, zoom);
	});

	it('creates latLng leaflet object', function () {
		var lat = 1,
			lng = 1,
			latLngMock = {},
			latLng;

		L.latLng.andReturn(latLngMock);

		latLng = apiUtils.createLatLng(lat, lng);

		expect(L.latLng).toHaveBeenCalledWith(lat, lng);
		expect(latLng).toBe(latLngMock);
	});
});
