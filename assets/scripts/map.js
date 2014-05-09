(function (window, L) {
	'use strict';

	var mapContainerId = 'map',
		map,
		popupWidthWithPhoto = 414,
		popupWidthWithoutPhoto = 314,
		photoWidth = 90,
		photoHeight = 90;

	/**
	 * @desc Build popup HTML
	 * @param point {object} - POI object
	 * @returns {string} - Popup HTML makup
	 */
	function buildPopupHtml(point) {
		//TODO what about edit link? where do we get it from?
		var photoHtml = '',
			titleHtml = '',
			descriptionHtml = '';

		if (point.photo && point.link) {
			photoHtml = buildLinkHtml(point, buildPhotoHtml(point.photo, point.name), 'photo');
		} else if (point.photo) {
			photoHtml = buildPhotoHtml(point.photo, point.name);
		}

		if (point.name) {
			titleHtml = '<h3>' + (point.link ? buildLinkHtml(point, point.name) : point.name) + '</h3>';
		}

		if (point.description) {
			descriptionHtml = '<p>' + point.description + '</p>';
		}

		return photoHtml +
			'<div class="description">' +
			titleHtml +
			descriptionHtml +
			'</div>';
	}

	/**
	 * @desc Build photo HTML
	 * @param photoUrl {string} - image URL
	 * @param alt {string} - image alternate text
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
	 * @param className {string=} - class name
	 * @returns {string} - HTMl markup for link
	 */
	function buildLinkHtml(point, innerHtml, className) {
		var classString;

		className = (typeof (className) !== 'undefined') ? className : null;
		classString = (className) ? ' class="' + className + '"' : '';

		return '<a href="' + point.link + '" title="' + point.name + '"' + classString + ' target="_blank">' +
			innerHtml +
			'</a>';
	}

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

	function buildLink(link, content) {
		if (link.length) {
			return '<a href="' + link + '" target="_blank">' + content + '</a>';
		}
	}

	/**
	 * @desc Converts size to maximal zoom level
	 * @param size {number} - maximal size length
	 * @returns {number} - maximal zoom level
	 */
	function sizeToZoomLevel(size) {
		return Math.ceil(Math.log(size) / Math.log(2)) - 8;
	}

	/**
	 * @desc Calculates minimum zoom level for map given the max viewport size
	 *
	 * Because generally map images are downscaled from the original image, which is rarely with the "correct" size,
	 * This function takes into account this fact and calculates the ratio between the original and ideal image size
	 * then multiplies the ratio to the maximal viewport size and gets the minimum zoom level for the compensated
	 * vieport size
	 *
	 * @param maxZoom {number} - maximal zoom level for the map
	 * @param maxSize {number} - max size of the image
	 * @param maxViewPortSize {number} - maximum viewport size
	 * @returns {number} - minimal zoom level
	 */
	function getMinZoomLevel(maxZoom, maxSize, maxViewPortSize) {
		var maxSizeForZoom = Math.pow(2, maxZoom + 8),
			ratio = maxSize / maxSizeForZoom,
			compensatedViewPortSize = maxViewPortSize / ratio;
		return Math.min(sizeToZoomLevel(compensatedViewPortSize), maxZoom);
	}

	/**
	 * @desc Create new map and add points to it
	 * @param config {object}
	 */
	function createMap(config) {
		var defaultMinZoom = getMinZoomLevel(
			config.layer.maxZoom,
			Math.max(config.width, config.height),
			Math.max(
				Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
				Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
			)
		);

		if (config.imagesPath) {
			L.Icon.Default.imagePath = config.imagesPath;
		}

		map = L.map(mapContainerId, {
				minZoom: config.layer.minZoom,
				maxZoom: config.layer.maxZoom
			});
		L.tileLayer(config.pathTemplate, config.layer).addTo(map);

		if (config.hasOwnProperty('boundaries')) {
			map.setMaxBounds(
				new L.LatLngBounds(
					L.latLng(config.boundaries.south, config.boundaries.west),
					L.latLng(config.boundaries.north, config.boundaries.east)
				)
			);
		}

		map.setView(
			L.latLng(config.latitude, config.longitude),
			Math.max(config.zoom, defaultMinZoom)
		);

		config.points.forEach(function (point) {
			addPointOnMap(point);
		});
	}

	createMap(window.mapSetup);

})(window, window.L);
