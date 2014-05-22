(function (window, L) {
	'use strict';

	var mapContainerId = 'map',
		map,
		pointTypesContainerId = 'pointTypes',
		pointTypeFiltersContainer,
		popupWidthWithPhoto = 414,
		popupWidthWithoutPhoto = 314,
		photoWidth = 90,
		photoHeight = 90,
		pointIconWidth = 32,
		pointIconHeight = 32,
		pointIcons = {},
		pointCache = {},
		pointTypes = {};


	/**
	 * @desc Build popup HTML
	 * @param point {object} - POI object
	 * @returns {string} - HTML markup for popup
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
	 * @param photoUrl {string} - Image URL
	 * @param alt {string} - Image alternate text
	 * @returns {string} - HTML markup for photo
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
	 * @param point {object} - POI object
	 * @returns {object} - Leaflet Marker
	 */
	function addPointOnMap(point) {
		var popup, popupWidth;

		popupWidth = (point.photo) ? popupWidthWithPhoto : popupWidthWithoutPhoto;

		popup = L
			.popup({
				closeButton: false,
				minWidth: popupWidth,
				maxWidth: popupWidth
			})
			.setContent(buildPopupHtml(point));

		return L.marker([point.lat, point.lon], {
			icon: pointIcons[point.poi_category_id],
			riseOnHover: true,
			type: point.type
		}).bindPopup(popup).addTo(map);
	}

	/**
	 * @desc Add filter for all point types
	 */
	function addAllPointsFilter() {
		var pointsToggleHtml = '<li id="pointTypeAll" class="point-type enabled" data-point-type="0">' +
			'All Pin Types' + //TODO what about translation?
			'</li>';
		pointTypeFiltersContainer.innerHTML += pointsToggleHtml;
	}

	/**
	 * @desc Add filter for given point type and set its icon
	 * @param pointType {object} - POI type object
	 */
	function addPointType(pointType) {
		// if you change this structure then check if bindPointTypeFilters() function is still working
		var pointTypeHtml = '<li class="point-type enabled" data-point-type="' + pointType.id + '">' +
			'<img src="' + pointType.marker + '" width="' + pointIconWidth + '" height="' + pointIconHeight + '">' +
			'<span>' + pointType.name + '</span>' +
			'</li>';
		pointTypeFiltersContainer.innerHTML += pointTypeHtml;

		pointIcons[pointType.id] = L.icon({
			iconUrl: pointType.marker,
			iconSize: [pointIconWidth, pointIconHeight],
			className: 'point-type-' + pointType.id
		});
	}

	/**
	 * @desc Return DOM elements for given point type, store them in cache
	 * @param pointType {number} - Id of point type, 0 for all types
	 * @returns {NodeList} - List of DOM elements corresponding with given point type
	 */
	function getPointsByType(pointType) {
		if (typeof pointCache[pointType] === 'undefined') {
			if (pointType === 0) {
				pointCache[pointType] = document.getElementsByClassName('leaflet-marker-icon');
			} else {
				pointCache[pointType] = document.getElementsByClassName('point-type-' + pointType);
			}
		}

		return pointCache[pointType];
	}

	/**
	 * @desc Mark filters for given point type as disabled
	 * @param filterClicked {Element} - Clicked filter element
	 * @param pointType {number} - Id of point type, 0 for all types
	 */
	function markPointTypeFiltersAsDisabled(filterClicked, pointType) {
		// remove .enabled class from clicked filter
		filterClicked.classList.remove('enabled');

		if (pointType === 0) {
			// remove .enabled class from all filters
			toggleAllPointTypeFilters('remove');
		} else {
			// remove .enabled class from "All pin types"
			document.getElementById('pointTypeAll').classList.remove('enabled');
		}
	}

	/**
	 * @desc Mark filters for given point type as enabled
	 * @param filterClicked {Element} - Clicked filter element
	 * @param pointType {number} - Id of point type, 0 for all types
	 */
	function markPointTypeFiltersAsEnabled(filterClicked, pointType) {
		if (pointType === 0) {
			// add .enabled class to all filters
			toggleAllPointTypeFilters('add');
		} else {
			// add .enabled class to clicked filter and if all filters are enabled then add it to "All pin types" too
			filterClicked.classList.add('enabled');

			if (pointTypes.length === pointTypeFiltersContainer.getElementsByClassName('point-type enabled').length) {
				document.getElementById('pointTypeAll').classList.add('enabled');
			}
		}
	}

	function toggleAllPointTypeFilters(operation) {
		var filters = pointTypeFiltersContainer.getElementsByClassName('point-type');

		Array.prototype.forEach.call(filters, function (filterElement) {
			filterElement.classList[operation]('enabled');
		});
	}

	/**
	 * Add .hidden class to all elements from given NodeList
	 * @param points {NodeList}
	 */
	function hidePoints(points) {
		for (var i = 0; i < points.length; i++) {
			points[i].classList.add('hidden');
		}
	}

	/**
	 * Remove .hidden class from all elements from given NodeList
	 * @param points {NodeList}
	 */
	function showPoints(points) {
		for (var i = 0; i < points.length; i++) {
			points[i].classList.remove('hidden');
		}
	}

	/**
	 * @desc Add event listener on click event for point type filters
	 */
	function bindPointTypeFilters() {
		pointTypeFiltersContainer.addEventListener('click', function (e) {
			var filterClicked = e.target,
				pointType,
				points;

			if (filterClicked.tagName === 'UL') {
				// we are too high in DOM, abort
				return;
			}

			if (filterClicked.parentNode.tagName === 'LI') {
				filterClicked = filterClicked.parentNode;
			}

			pointType = parseInt(filterClicked.getAttribute('data-point-type'), 10);

			points = getPointsByType(pointType);

			if (filterClicked.classList.contains('enabled')) {
				markPointTypeFiltersAsDisabled(filterClicked, pointType);
				hidePoints(points);

			} else {
				markPointTypeFiltersAsEnabled(filterClicked, pointType);
				showPoints(points);
			}
		}, false);
	}

	/**
	 * @desc Create points and filters for them
	 * @param config {object}
	 */
	function createPoints(config) {
		pointTypes = config.types;

		addAllPointsFilter();

		config.types.forEach(function (pointType) {
			addPointType(pointType);
		});

		config.points.forEach(function (point) {
			addPointOnMap(point);
		});

		bindPointTypeFilters();
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
	 * @desc Create new map
	 * @param config {object}
	 */
	function createMap(config) {
		var zoomControl, defaultMinZoom;

		defaultMinZoom = getMinZoomLevel(
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
			maxZoom: config.layer.maxZoom,
			zoomControl: false
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

		zoomControl = L.control.zoom({
			position: 'bottomright'
		});
		map.addControl(zoomControl);

		createPoints(config);
	}

	pointTypeFiltersContainer = document.getElementById(pointTypesContainerId);

	createMap(window.mapSetup);

})(window, window.L);
