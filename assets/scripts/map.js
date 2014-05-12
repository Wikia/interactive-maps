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
			.marker([point.lat, point.lon], {
				riseOnHover: true
			})
			.bindPopup(popup)
			.addTo(map);
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
		return sizeToZoomLevel(compensatedViewPortSize);
	}

	/**
	 * @desc Create new map and add points to it
	 * @param config {object}
	 */
	function createMap(config) {
		if (config.imagesPath) {
			L.Icon.Default.imagePath = config.imagesPath;
		}

		config.layer.minZoom = getMinZoomLevel(
			config.layer.maxZoom,
			Math.max(config.width, config.height),
			Math.max(
				Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
				Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
			)
		);

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

		config.points.forEach(function (point) {
			addPointOnMap(point);
		});
	}

	createMap(window.mapSetup);

})(window, window.L);
