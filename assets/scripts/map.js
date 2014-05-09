(function(window, L){
	'use strict';

	var mapContainerId = 'map',
		map;

	/**
	 * @desc Add point to the map
	 * @param point {object}
	 * @returns {object} Leaflet Marker
	 */
	function addPointOnMap(point) {
		var popupHtml = '<h3>' + point.name + '</h3>' +
			'<p>' +point.description + '</p>';
		return L.marker([ point.lat, point.lon ], {
			riseOnHover: true
		})
			.bindPopup(popupHtml)
			.addTo(map);
	}

	/**
	 * @desc Create new map and add points to it
	 * @param config {object}
	 */
	function createMap(config) {
		if (config.imagesPath) {
			L.Icon.Default.imagePath = config.imagesPath;
		}
		map = L.map(mapContainerId, {
				minZoom: config.layer.minZoom,
				maxZoom: config.layer.maxZoom
			})
		L.tileLayer(config.pathTemplate, config.layer).addTo(map);

		if (config.hasOwnProperty('boundaries')) {
			map.setMaxBounds(
				new L.LatLngBounds(
					L.latLng(config.boundaries.south, config.boundaries.west),
					L.latLng(config.boundaries.north, config.boundaries.east)
				)
			);
		}

		map.setView([config.latitude, config.longitude],
			Math.max(config.zoom, config.layer.minZoom)
		);

		config.points.forEach(function (point){
			addPointOnMap(point);
		});
	}

	createMap(window.mapSetup);

})(window, window.L);
