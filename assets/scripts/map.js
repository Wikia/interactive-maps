(function(window, L){
	'use strict';

	var mapContainerId = 'map',
		map;

	function addPointOnMap(point) {
		var popupHtml = '<h3>' + point.title + '</h3>' +
			'<p>' +point.description + '</p>';
		return L.marker([ point.lat, point.lon ], {
			riseOnHover: true
		})
			.bindPopup(popupHtml)
			.addTo(map);
	}

	function createMap(config) {
		if (config.imagesPath) {
			L.Icon.Default.imagePath = config.imagePath;
		}
		map = L.map(mapContainerId)
			.setView([config.latitude, config.longitude], config.zoom);

		L.tileLayer(config.pathTemplate, config.mapSetup).addTo(map);

		config.points.forEach(function (point){
			addPointOnMap(point);
		});

	}

	createMap(window.mapSetup);

})(window, window.L);
