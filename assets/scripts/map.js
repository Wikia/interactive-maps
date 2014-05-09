(function (window, L) {
	'use strict';

	var mapContainerId = 'map',
		map;

	/**
	 * @desc Add point to the map
	 * @param point {object}
	 * @returns {object} Leaflet Marker
	 */
	function addPointOnMap(point) {
        //TODO what about edit link? where do we get it from?
		var popupHtml = '<article>';

		if (point.photo.length) {
			//TODO what about that width and height?
			popupHtml += '<figure>' +
				buildLink(point.link, '<img src="' + point.photo + '" width="90" height="90">') +
				'</figure>';
		}

		popupHtml += '<div class="description">';
		popupHtml += '<h3>' + buildLink(point.link, point.name) + '</h3>';
		popupHtml += '<p>' + point.description + '</p>';
		popupHtml += '</div>';

		popupHtml += '</article>';

		var popup = L
			.popup({
				closeButton: false,
				maxWidth: 380
			})
			.setContent(popupHtml);

		return L
			.marker([ point.lat, point.lon ], {
				riseOnHover: true
			})
			.bindPopup(popup)
			.addTo(map);
	}

	function buildLink(link, content) {
		if (link.length) {
			return '<a href="' + link + '" target="_blank">' + content + '</a>';
		}
	}

	/**
	 * @desc Create new map and add points to it
	 * @param config {object}
	 */
	function createMap(config) {
		if (config.imagesPath) {
			L.Icon.Default.imagePath = config.imagesPath;
		}
		map = L.map(mapContainerId)
			.setView([config.latitude, config.longitude], config.zoom);

		L.tileLayer(config.pathTemplate, config.map).addTo(map);

		config.points.forEach(function (point) {
			addPointOnMap(point);
		});

	}

	createMap(window.mapSetup);

})(window, window.L);
