(function (window, L) {
	'use strict';

	var mapContainerId = 'map',
		map,
		popupMaxWidth = 380,
		photoWidth = 90,
		photoHeight = 90;

	/**
	 * @desc Build popup HTML
	 * @param point {object} - POI object
	 * @returns {string} - Popup HTML makup
	 */
	function buildPopupHtml(point) {
		//TODO what about edit link? where do we get it from?
		var photoHtml = '';

		if (point.photo && point.link) {
			photoHtml = buildLinkHtml(point, buildPhotoHtml(point.photo, point.name));
		} else if (point.photo) {
			photoHtml = buildPhotoHtml(point.photo, point.name);
		}

		return photoHtml +
			'<h3>' + (point.link ? buildLinkHtml(point, point.name) : point.name) + '</h3>' +
			'<p>' + point.description + '</p>';
	}

	/**
	 * @desc Build photo HTML
	 * @param photoUrl {string} - image URL
	 * @returns {string} Photo HTML
	 */
	function buildPhotoHtml(photoUrl, alt) {
		//TODO what about that width and height?
		return '<img src="' + photoUrl + '" alt="' + alt + '" width="' + photoWidth + '" height="' + photoHeight + '">';
	}

	/**
	 * @desc Build link HTML
	 * @param point {object} - POI object
	 * @param innerHtml {string} - string of HTML markup
	 * @returns {string} - HTMl markup for link
	 */
	function buildLinkHtml(point, innerHtml) {
		return '<a href="' + point.link + '" title="' + point.name + '" target="_blank">' + innerHtml + '</a>';
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
			.marker([point.lat, point.lon], {
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
		map = L
			.map(mapContainerId)
			.setView([config.latitude, config.longitude], config.zoom);

		L.tileLayer(config.pathTemplate, config.map).addTo(map);

		config.points.forEach(function (point) {
			addPointOnMap(point);
		});
	}

	createMap(window.mapSetup);

})(window, window.L);
