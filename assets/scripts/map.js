(function (window, L) {
	'use strict';

	var mapContainerId = 'map',
		pointTypeFiltersContainerId = 'pointTypes',
		allPointTypesFilterId = 'allPointTypes',
		map,
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
			photoHtml = buildLinkHtml(point, buildImageHtml(point.photo, point.name, photoWidth, photoHeight), 'photo');
		} else if (point.photo) {
			photoHtml = buildImageHtml(point.photo, point.name, photoWidth, photoHeight);
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
	 * @desc Build image HTML
	 * @param imageUrl {string} - Image URL
	 * @param alt {string} - Image alternate text
	 * @returns {string} - HTML markup for photo
	 */
	function buildImageHtml(imageUrl, alt, imageWidth, imageHeight) {
		return '<img src="' + imageUrl + '" alt="' + alt + '" width="' + imageWidth + '" height="' + imageHeight + '">';
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
	 * @desc Build point type filter HTML
	 * @param pointType {object} - POI type object
	 * @returns {string} - HTML markup for point type filter
	 */
	function buildPointTypeFilterHtml(pointType) {
		return '<li class="point-type enabled" data-point-type="' + pointType.id + '">' +
			buildImageHtml(pointType.marker, pointType.name, pointIconWidth, pointIconHeight) +
			'<span>' + pointType.name + '</span>' +
			'</li>';
	}

	/**
	 * @desc Setup icon for markers with given point type
	 * @param pointType {object} - POI type object
	 */
	function setupPointTypeIcon(pointType) {
		pointIcons[pointType.id] = L.icon({
			iconUrl: pointType.marker,
			iconSize: [pointIconWidth, pointIconHeight],
			className: 'point-type-' + pointType.id
		});
	}

	/**
	 * @desc Loads points of given type to cache and returns them
	 * @param pointType {number} - Id of point type, 0 for all types
	 * @returns {NodeList} - List of DOM elements corresponding with given point type
	 */
	function loadPointsToCache(pointType) {
		pointCache[pointType] = document.getElementsByClassName(
			(pointType === 0) ?
			'leaflet-marker-icon' :
			'point-type-' + pointType
		);

		return pointCache[pointType];
	}

	/**
	 * @desc Return DOM elements for given point type
	 * @param pointType {number} - Id of point type, 0 for all types
	 * @returns {NodeList} - List of DOM elements corresponding with given point type
	 */
	function getPointsByType(pointType) {
		return (pointCache.hasOwnProperty(pointType)) ? pointCache[pointType] : loadPointsToCache(pointType);
	}

	/**
	 * @desc Adds or removes class of DOM element
	 * @param element {Element} - DOM element
	 * @param className {string} - Name of class to toggle
	 * @param operation {string} - 'add' or 'remove' class
	 */
	function toggleClass(element, className, operation) {
		element.classList[operation](className);
	}

	/**
	 * @desc Toggles visibility of points corresponding with clicked filter
	 * @param filterClicked {Element} - Filter element that was clicked
	 */
	function togglePoints(filterClicked) {
		var pointType = parseInt(filterClicked.getAttribute('data-point-type'), 10),
			points = getPointsByType(pointType),
			pointsLength = points.length,
			filterEnabled = filterClicked.classList.contains('enabled'),
			i;

		for (i = 0; i < pointsLength; i++) {
			toggleClass(points[i], 'hidden', (filterEnabled) ? 'remove' : 'add');
		}
	}

	/**
	 * @desc Toggles state of point type filter
	 * @param filterClicked {Element} - Filter element that was clicked
	 */
	function togglePointTypeFilter(filterClicked) {
		var filterEnabled = filterClicked.classList.contains('enabled');

		toggleClass(filterClicked, 'enabled', (filterEnabled) ? 'remove' : 'add');
	}

	/**
	 * @desc Toggles state of "All pin types" filter
	 */
	function toggleAllPointTypesFilter() {
		var allPointTypesFilter = document.getElementById(allPointTypesFilterId),
			filtersEnabledLength = pointTypeFiltersContainer.getElementsByClassName('point-type enabled').length;

		toggleClass(allPointTypesFilter, 'enabled', (pointTypes.length === filtersEnabledLength) ? 'add' : 'remove');
	}

	/**
	 * @desc Handles click on "All pin types" filter
	 */
	function allPointTypesFilterClickHandler() {
		var allPointTypesFilter = document.getElementById(allPointTypesFilterId),
			filterEnabled = allPointTypesFilter.classList.contains('enabled'),
			filters = pointTypeFiltersContainer.getElementsByClassName('point-type'),
			filtersLength = filters.length,
			i;

		for (i = 0; i < filtersLength; i++) {
			toggleClass(filters[i], 'enabled', (filterEnabled) ? 'remove' : 'add');
		}

		toggleAllPointTypesFilter();
		togglePoints(allPointTypesFilter);
	}

	/**
	 * @desc Handles click on point type filter
	 * @param filterClicked {Element} - Filter element that was clicked
	 */
	function pointTypeFilterClickHandler(filterClicked) {
		togglePointTypeFilter(filterClicked);
		toggleAllPointTypesFilter();
		togglePoints(filterClicked);
	}

	/**
	 * @desc Handles click on point type filters container
	 * @param event {Event} - Click event
	 */
	function pointTypeFiltersContainerClickHandler(event) {
		var elementClicked = event.target,
			filterClicked = elementClicked,
			pointType;

		if (elementClicked.parentNode.tagName === 'LI') {
			filterClicked = elementClicked.parentNode;
		}

		pointType = parseInt(filterClicked.getAttribute('data-point-type'), 10);

		if (pointType === 0) {
			allPointTypesFilterClickHandler();
		} else {
			pointTypeFilterClickHandler(filterClicked);
		}
	}

	/**
	 * @desc Create points and filters for them
	 * @param config {object}
	 */
	function setupPoints(config) {
		var pointTypeFiltersHtml = '';

		pointTypes = config.types;

		config.types.forEach(function (pointType) {
			setupPointTypeIcon(pointType);
			pointTypeFiltersHtml += buildPointTypeFilterHtml(pointType);
		});

		pointTypeFiltersContainer = document.getElementById(pointTypeFiltersContainerId);
		pointTypeFiltersContainer.innerHTML += pointTypeFiltersHtml;

		config.points.forEach(addPointOnMap);

		pointTypeFiltersContainer.addEventListener('click', pointTypeFiltersContainerClickHandler, false);
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

		setupPoints(config);
	}

	createMap(window.mapSetup);

})(window, window.L);
