(function (window, L, Ponto, Tracker) {
	'use strict';

	var mapContainerId = 'map',
		pointTypeFiltersContainerId = 'pointTypes',
		allPointTypesFilterId = 'allPointTypes',

		pontoBridgeModule = 'wikia.intMap.pontoBridge',

		// leaflet map object
		map,
		// leaflet layer for storing markers
		markers = new L.LayerGroup(),
		// leaflet layer for drawing controls
		drawControls = new L.Control.Draw({
			position: 'bottomright',
			draw: {
				polyline: false,
				polygon: false,
				circle: false,
				rectangle: false
			}
		}),

		// constants
		popupWidthWithPhoto = 414,
		popupWidthWithoutPhoto = 314,
		photoWidth = 90,
		photoHeight = 90,
		pointIconWidth = 32,
		pointIconHeight = 32,

		pointTypeFiltersContainer,
		pointIcons = {},
		pointCache = {},
		pointTypes = {},
		config = window.mapSetup;

	/**
	 * @desc Translates message
	 * @param {string} message
	 * @returns {string}
	 */
	function msg(message) {
		return config.i18n.hasOwnProperty(message) ? config.i18n[message] : message;
	}

	/**
	 * @desc Build popup HTML
	 * @param {object} point - POI object
	 * @returns {string} - HTML markup for popup
	 */
	function buildPopupHtml(point) {
		var editLink = '<a href="" title="Edit" class="edit-poi-link" data-marker-id="' + point.leafletId + '">' +
				msg('wikia-interactive-maps-edit-poi') + '</a>',
			photoHtml = '',
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
			editLink +
			descriptionHtml +
			'</div>';
	}

	/**
	 * @desc Build image HTML
	 * @param {string} imageUrl - Image URL
	 * @param {string} alt - Image alternate text
	 * @param {number} imageWidth
	 * @param {number} imageHeight
	 * @returns {string} - HTML markup for photo
	 */
	function buildImageHtml(imageUrl, alt, imageWidth, imageHeight) {
		return '<img src="' + imageUrl + '" alt="' + alt + '" width="' + imageWidth + '" height="' + imageHeight + '">';
	}

	/**
	 * @desc Build link HTML
	 * @param {object} point - POI object
	 * @param {string} innerHtml - string of HTML markup
	 * @param {string=} className - class name
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
	 * @param {object} point - POI object
	 * @returns {object} - marker object
	 */
	function addPointOnMap(point) {
		var marker = L.marker([point.lat, point.lon], {
				icon: pointIcons[point.poi_category_id],
				riseOnHover: true,
				type: point.type
			}),
			popupWidth = (point.photo) ? popupWidthWithPhoto : popupWidthWithoutPhoto,
			popup =  L.popup({
				closeButton: false,
				minWidth: popupWidth,
				maxWidth: popupWidth
			});

		// extend point data with marker leaflet id - need to be done after adding marker to the map layer group !!!
		marker.addTo(markers);
		point.leafletId = marker._leaflet_id;

		// extend marker object with point data;
		marker.point = point;

		popup.setContent(buildPopupHtml(point));
		marker.bindPopup(popup);

		return marker;
	}

	/**
	 * @desc Build point type filter HTML
	 * @param {object} pointType - POI type object
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
	 * @param {object} pointType - POI type object
	 */
	function setupPointTypeIcon(pointType) {
		var pointTypeIcon;

		if (pointType.marker !== null) {
			pointTypeIcon = L.icon({
				iconUrl: pointType.marker,
				iconSize: [pointIconWidth, pointIconHeight]
			});
		} else {
			pointTypeIcon = new L.Icon.Default();
			// this is the nicest way to do that I found
			// we need to overwrite it here so in the filter box we have not broken image
			pointType.marker = pointTypeIcon._getIconUrl('icon');
		}

		L.setOptions(pointTypeIcon, {
			className: 'point-type-' + pointType.id
		});

		pointIcons[pointType.id] = pointTypeIcon;
	}

	/**
	 * @desc Loads points of given type to cache and returns them
	 * @param {number} pointType - Id of point type, 0 for all types
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
	 * @param {number} pointType - Id of point type, 0 for all types
	 * @returns {NodeList} - List of DOM elements corresponding with given point type
	 */
	function getPointsByType(pointType) {
		return (pointCache.hasOwnProperty(pointType)) ? pointCache[pointType] : loadPointsToCache(pointType);
	}

	/**
	 * @desc Adds or removes class of DOM element
	 * @param {Element} element - DOM element
	 * @param {string} className - Name of class to toggle
	 * @param {string} operation - 'add' or 'remove' class
	 */
	function toggleClass(element, className, operation) {
		element.classList[operation](className);
	}

	/**
	 * @desc Toggles visibility of points corresponding with clicked filter
	 * @param {Element} filterClicked - Filter element that was clicked
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
	 * @param {Element} filterClicked - Filter element that was clicked
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
	 * @param {Element} filterClicked - Filter element that was clicked
	 */
	function pointTypeFilterClickHandler(filterClicked) {
		togglePointTypeFilter(filterClicked);
		toggleAllPointTypesFilter();
		togglePoints(filterClicked);
	}

	/**
	 * @desc Handles click on point type filters container
	 * @param {Event} event - Click event
	 */
	function pointTypeFiltersContainerClickHandler(event) {
		var elementClicked = event.target,
			filterClicked = elementClicked,
			pointType;

		if (elementClicked.parentNode.tagName === 'LI') {
			filterClicked = elementClicked.parentNode;
		}

		map.closePopup();

		pointType = parseInt(filterClicked.getAttribute('data-point-type'), 10);

		if (pointType === 0) {
			allPointTypesFilterClickHandler();
		} else {
			pointTypeFilterClickHandler(filterClicked);
		}
	}

	/**
	 * Create Point types filter container
	 * @param {object} container
	 * @returns {object}
	 */
	function createPointTypeFiltersContainer(container) {
		var div = document.createElement('div'),
			h3 = document.createElement('h3'),
			ul = document.createElement('ul'),
			li = document.createElement('li');

		div.setAttribute('class', 'filter-menu');

		h3.appendChild(document.createTextNode(msg('wikia-interactive-maps-filters')));
		div.appendChild(h3);

		ul.setAttribute('id', pointTypeFiltersContainerId);
		ul.setAttribute('class', 'point-types');

		li.setAttribute('id', 'allPointTypes');
		li.setAttribute('class', 'enabled');
		li.setAttribute('data-point-type', '0');
		li.appendChild(document.createTextNode(msg('wikia-interactive-maps-all-pin-types')));
		ul.appendChild(li);
		div.appendChild(ul);
		container.appendChild(div);
		return div;
	}

	/**
	 * @desc Create points and filters for them
	 */
	function setupPoints() {
		var pointTypeFiltersHtml = '';

		pointTypes = config.types;

		config.types.forEach(function (pointType) {
			setupPointTypeIcon(pointType);
			pointTypeFiltersHtml += buildPointTypeFilterHtml(pointType);
		});

		pointTypeFiltersContainer = createPointTypeFiltersContainer(document.body);
		pointTypeFiltersContainer.innerHTML += pointTypeFiltersHtml;

		config.points.forEach(addPointOnMap);

		pointTypeFiltersContainer.addEventListener('click', pointTypeFiltersContainerClickHandler, false);
	}

	/**
	 * @desc Converts size to maximal zoom level
	 * @param {number} size - maximal size length
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
	 * @param {number} maxZoom - maximal zoom level for the map
	 * @param {number} maxSize - max size of the image
	 * @param {number} maxViewPortSize - maximum viewport size
	 * @returns {number} - minimal zoom level
	 */
	function getMinZoomLevel(maxZoom, maxSize, maxViewPortSize) {
		var maxSizeForZoom = Math.pow(2, maxZoom + 8),
			ratio = maxSize / maxSizeForZoom,
			compensatedViewPortSize = maxViewPortSize / ratio;
		return Math.min(sizeToZoomLevel(compensatedViewPortSize), maxZoom);
	}

	/**
	 * @desc adds temporary marker
	 * @param {Event} event
	 * @returns {object} temp marker object
	 */
	function addTempMarker(event) {
		var marker = event.layer,
			latLng = marker.getLatLng();

		marker.point = {
			lat: latLng.lat,
			lon: latLng.lng
		};

		return marker;
	}

	/**
	 * @desc get marker from markers layer group
	 * @param {string} id - leaflet markers id
	 * @returns {object} - marker object
	 */
	function getMarker(id) {
		return markers.getLayer(id);
	}

	/**
	 * @desc sends data to Wikia Client via ponto to add / edit POI
	 * @param {object} marker - marker object
	 */
	function editMarker(marker) {
		var params = {
				action: 'editPOI',
				data: marker.point
			},
			mapSetup = window.mapSetup;

		params.data.mapId = mapSetup.id;
		params.data.categories = mapSetup.types;

		Ponto.invoke(pontoBridgeModule, 'processData', params, function (point) {
			// removes old marker from layer group
			if (markers.hasLayer(marker)) {
				markers.removeLayer(marker);
			}
			// adds new marker to layer group
			if (point) {
				addPointOnMap(point).openPopup();
			}
		}, showPontoError, true);
	}

	/**
	 * @desc shows error message for ponto communication
	 * @param {string} message - error message
	 * @todo figure out were to display them
	 */

	function showPontoError(message) {
		console.log(message);
		console.log('error!!!');
	}

	/**
	 * @desc setup Ponto communication for Wikia Client
	 */
	function setupPontoWikiaClient() {
		if (window.self !== window.top) {
			Ponto.setTarget(Ponto.TARGET_IFRAME_PARENT, '*');
			Ponto.invoke(pontoBridgeModule, 'isWikia', null, setUpEditOptions, showPontoError, false);
		} else {
			Tracker.track('map', Tracker.ACTIONS.IMPRESSION, 'embedded-map-displayed');
		}
	}

	/**
	 * @desc setup edit options for Wikia only
	 * @param {bool} isWikia - true if iframe is displayed on Wikia page
	 */
	function setUpEditOptions(isWikia) {
		var doc = window.document,
			mapContainer = doc.getElementById(mapContainerId);

		if (isWikia) {
			// add POI handler
			map.on('draw:created', function (event) {
				editMarker(addTempMarker(event));
			});

			// edit POI handler
			mapContainer.addEventListener('click', function (event) {
				var target = event.target;

				if (target.classList.contains('edit-poi-link')) {
					event.preventDefault();
					editMarker(getMarker(target.getAttribute('data-marker-id')));
				}
			}, false);

			// show edit UI elements
			mapContainer.classList.add('enable-edit');
			map.addControl(drawControls);
			Tracker.track('map', Tracker.ACTIONS.IMPRESSION, 'wikia-map-displayed');
		}
	}

	/**
	 * @desc Sets up the interface translations
	 */
	function setupInterfaceTranslations() {
		L.drawLocal.draw.handlers.marker.tooltip.start = msg('wikia-interactive-maps-create-marker-handler');
		L.drawLocal.draw.toolbar.buttons.marker = msg('wikia-interactive-maps-create-marker-tooltip');
		L.drawLocal.draw.toolbar.actions.text = msg('wikia-interactive-maps-create-marker-cancel');
	}

	/**
	 * @desc Sets up click tracking for service
	 */
	function setupClickTracking() {
		map.on('popupopen', function() {
			Tracker.track('map', Tracker.ACTIONS.CLICK_LINK_IMAGE, 'poi');
		});
	}

	/**
	 * @desc Create new map
	 */
	function createMap() {
		var zoomControl,
			defaultMinZoom;

		setupInterfaceTranslations();

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

		map.attributionControl.setPrefix(false);

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
		setupPontoWikiaClient();
		setupPoints();
		setupClickTracking();
		markers.addTo(map);
	}

	createMap();

})(window, window.L, window.Ponto, window.Tracker);
