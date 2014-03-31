(function($, L){
	'use strict';

	//TODO: Figure out base url
	var apiHost = 'http://localhost:3000',
		apiBaseDirectory = 'api',
		apiVersion = 'v1',
		mapContainerId = 'map',

		// TODO: remove this once we return all required info from the API
		defaultMapConfig = {
			initLat: 0,
			initLon: 0,
			initZoom: 0,
			pathTemplate: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
			mapSetup: {}
		};

	function createUrl(request) {
		return [
			apiHost,
			apiBaseDirectory,
			apiVersion,
			request
		].join('/');
	}

	function message(text, messageType) {
		messageType = messageType || 'error';
		$('<div></div>' )
			.addClass('message ' + messageType)
			.html(text)
			.bind('click', function(){
				$(this).remove();
			})
			.appendTo('body');
	}

	function createPoints(pointsOfInterest) {
		// TODO: Add points to the map
	}

	function createMap(config) {
		var map;

		config = $.extend(true, config, defaultMapConfig);
		map = L.map(mapContainerId)
			.setView([config.initLat, config.initLon], config.initZoom);

		L.tileLayer(config.pathTemplate, config.mapSetup).addTo(map);

		createPoints(config);
	}

	function init(){
		$.get(createUrl('map/1'), function(data) {
			createMap(data);
		}, 'json')
			.fail(function(jqXHR, textStatus, errorThrown){
				message(errorThrown);
			});
	}

	init();
})(window.jQuery, window.L);
