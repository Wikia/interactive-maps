(function (window, L) {
	'use strict';

	var mapContainerId = 'map',
		map,
		popupMaxWidth = 380,
		photoWidth = 90,
		photoHeight = 90;

	/**
	 * @desc Build popup HTML
	 * @param point {object}
	 * @returns {string} Popup HTML
	 */
	function buildPopupHtml(point) {
		//TODO what about edit link? where do we get it from?
		return buildPhotoHtml(point) +
			'<h3>' + buildLink(point, point.name) + '</h3>' +
			'<p>' + point.description + '</p>';
	}

	/**
	 * @desc Build photo HTML if given point has photo
	 * @param point {object}
	 * @returns {string} Photo HTML or empty string if there is no photo available
	 */
	function buildPhotoHtml(point) {
		if (point.photo) {
			//TODO what about that width and height?
			var imgHtml = '<img src="' + point.photo + '" width="' + photoWidth + '" height="' + photoHeight + '">';
			return buildLink(point, imgHtml);
		}

		return '';
	}

	/**
	 * @desc Build HTML for "a" element if given point has link
	 * @param point {object}
	 * @param innerHtml {string}
	 * @returns {string} Link HTML element or plain content if there is no link available
	 */
	function buildLink(point, innerHtml) {
		if (point.link) {
			return '<a href="' + point.link + '" title="' + point.name + '" target="_blank">' + innerHtml + '</a>';
		}

		return innerHtml;
	}

	/**
	 * @desc Add point to the map
	 * @param point {object}
	 * @returns {object} Leaflet Marker
	 */
	function addPointOnMap(point) {
		var popup = L
			.popup({
				closeButton: false,
				maxWidth: popupMaxWidth
			})
			.setContent(buildPopupHtml(point));

		return L
			.marker([ point.lat, point.lon ], {
				riseOnHover: true
			})
			.bindPopup(popup)
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
		map = L.map(mapContainerId)
			.setView([config.latitude, config.longitude], 3);

		L.tileLayer(config.pathTemplate, config.map).addTo(map);

		config.points.forEach(function (point) {
			addPointOnMap(point);
		});
	}

	createMap(window.mapSetup);

})(window, window.L);
