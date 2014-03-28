(function($, L){
	'use strict';

	var apiBaseDirectory = 'api',
		apiVersion = 'v1',
		mapContainerId = 'map';

	function createUrl(request) {
		return [
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
		// TODO: Initialize map once we have the data
		var map = L.map(mapContainerId).setView([0, 0], 1);
		L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {}).addTo(map);
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
