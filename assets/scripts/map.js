(function (window, L, Ponto, Tracker) {
	'use strict';

	var doc = window.document,
		body = doc.body,
		mapContainerId = 'map',
		pointTypeFiltersContainerId = 'pointTypes',
		editPointTypesButtonId = 'editPointTypes',
		allPointTypesFilterId = 'allPointTypes',

		pontoBridgeModule = 'wikia.intMap.pontoBridge',
		uiControlsPosition = 'bottomright',

		// leaflet map object
		map,
		// leaflet layer for storing markers
		markers = new L.LayerGroup(),
		// leaflet layer for drawing controls
		drawControls = new L.Control.Draw({
			position: uiControlsPosition,
			draw: {
				polyline: false,
				polygon: false,
				circle: false,
				rectangle: false
			}
		}),
		embedMapCodeButton,

		// constants
		popupWidthWithPhoto = 414,
		popupWidthWithoutPhoto = 314,
		mobilePopupWidth = 310,
		photoWidth = 90,
		photoHeight = 90,
		pointIconWidth = 30,
		pointIconHeight = 30,

		autoZoomPadding = 0.01,

		pointTypeFiltersContainer,
		pointIcons = {},
		pointCache = {},
		pointTypes = {},
		config = window.mapSetup,
		editablePointTypes,
		// @todo Remove these once Ponto is fixed
		isWikiaSet = false,
		pontoTimeout = 500;

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
		var editLink = '<a title="Edit" class="edit-poi-link" data-marker-id="' + point.leafletId + '">' +
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
			titleHtml = '<h3>' + (point.link ? buildLinkHtml(point, point.name, 'poi-article-link') : point.name) +
				'</h3>';
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
		return '<img src="' + imageUrl + '" alt="' + alt + '" width="' + imageWidth + '" height="'+ imageHeight + '">';
	}

	/**
	 * @desc Builds filter html
	 * @param {string} imageUrl
	 * @param {string} alt
	 * @returns {string} HTML markup for filter box icon
	 */
	function buildFilterHtml(imageUrl, alt) {
		return '<div class="point-type-icon"><img src="' + imageUrl + '" alt="' + alt + '"></div>';
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
				maxWidth: popupWidth,
				keepInView: true
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
			buildFilterHtml(pointType.marker, pointType.name) +
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

			// we need this one for edit POI categories popup
			pointType.no_marker = true;
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
		pointCache[pointType] = doc.querySelectorAll(
			(pointType === 0) ?
			'.leaflet-marker-icon, .leaflet-marker-shadow' :
			'.point-type-' + pointType
		);

		return pointCache[pointType];
	}

	/**
	 * @desc Deletes points from point cache
	 * @param {number} pointType - Id of point type
	 */
	function invalidatePointsCache(pointType) {
		delete pointCache[pointType];
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
	 */
	function toggleClass(element, className) {
		var classList = element.className;
		if (classList.indexOf(className) !== -1) {
			removeClass(element, className);
		} else {
			addClass(element, className);
		}
	}

	/**
	 * @desc Removes a class from an element
	 * @param {HTMLElement} element
	 * @param {string} className
	 */
	function removeClass(element, className) {
		var regexp = new RegExp('(?:^|\\s)' + className + '(?!\\S)', 'g');
		element.className = element.className.replace(regexp, '');
	}

	/**
	 * @desc Adds a class to an element
	 * @param {HTMLElement} element
	 * @param {string} className
	 */
	function addClass(element, className) {
		if (element.className.indexOf(className) === -1) {
			element.className += ' ' + className;
		}
	}

	/**
	 * @desc Toggles visibility of points corresponding with clicked filter
	 * @param {Element} filterClicked - Filter element that was clicked
	 */
	function togglePoints(filterClicked) {
		var pointType = parseInt(filterClicked.getAttribute('data-point-type'), 10),
			points = getPointsByType(pointType),
			pointsLength = points.length,
			i;

		for (i = 0; i < pointsLength; i++) {
			toggleClass(points[i], 'hidden');
		}
	}

	/**
	 * @desc Toggles state of point type filter
	 * @param {Element} filterClicked - Filter element that was clicked
	 */
	function togglePointTypeFilter(filterClicked) {
		Tracker.track(
			'map',
			Tracker.ACTIONS.CLICK,
			'poi-category-filter',
			parseInt(filterClicked.getAttribute('data-point-type'), 10)
		);

		toggleClass(filterClicked, 'enabled');
	}

	/**
	 * @desc Toggles state of "All pin types" filter
	 */
	function toggleAllPointTypesFilter() {
		var allPointTypesFilter = doc.getElementById(allPointTypesFilterId),
			enabled = 'enabled',
			filtersEnabledLength = pointTypeFiltersContainer.getElementsByClassName('point-type enabled').length;

		if (pointTypes.length === filtersEnabledLength &&
			allPointTypesFilter.className.indexOf(enabled) === -1){
			addClass(allPointTypesFilter, enabled);
		} else {
			removeClass(allPointTypesFilter, enabled);
		}

	}

	/**
	 * @desc Handles click on "All pin types" filter
	 */
	function allPointTypesFilterClickHandler() {
		var allPointTypesFilter = doc.getElementById(allPointTypesFilterId),
			filters = pointTypeFiltersContainer.getElementsByClassName('point-type'),
			filtersLength = filters.length,
			enabled = allPointTypesFilter.className.indexOf('enabled') === -1,
			i;

		for (i = 0; i < filtersLength; i++) {
			if (enabled) {
				addClass(filters[i], 'enabled');
			} else {
				removeClass(filters[i], 'enabled');
			}
		}

		toggleAllPointTypesFilter();
		togglePoints(allPointTypesFilter);

		Tracker.track('map', Tracker.ACTIONS.CLICK, 'poi-category-filter', 0);
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
		var div = doc.createElement('div'),
			header = doc.createElement('div'),
			headerTitle = doc.createElement('span'),
			headerEdit = doc.createElement('span'),
			ul = doc.createElement('ul'),
			li = doc.createElement('li');

		div.setAttribute('class', 'filter-menu hidden-box');

		header.setAttribute('class', 'filter-menu-header');

		headerTitle.appendChild(doc.createTextNode(msg('wikia-interactive-maps-filters')));
		header.appendChild(headerTitle);

		headerEdit.setAttribute('id', editPointTypesButtonId);
		headerEdit.setAttribute('class', 'edit-point-types');
		headerEdit.appendChild(doc.createTextNode(msg('wikia-interactive-maps-edit-pin-types')));
		header.appendChild(headerEdit);

		div.appendChild(header);

		ul.setAttribute('id', pointTypeFiltersContainerId);
		ul.setAttribute('class', 'point-types');

		li.setAttribute('id', 'allPointTypes');
		li.setAttribute('class', 'enabled');
		li.setAttribute('data-point-type', '0');
		li.appendChild(doc.createTextNode(msg('wikia-interactive-maps-all-pin-types')));
		ul.appendChild(li);
		div.appendChild(ul);
		container.appendChild(div);
		return ul;
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

		pointTypeFiltersContainer = createPointTypeFiltersContainer(document.getElementById('wrapper'));
		pointTypeFiltersContainer.innerHTML += pointTypeFiltersHtml;

		config.points.forEach(addPointOnMap);

		pointTypeFiltersContainer.addEventListener('click', pointTypeFiltersContainerClickHandler, false);
		document.querySelector('.filter-menu-header').addEventListener('click', handleBoxHeaderClick);
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
			};

		params.data.mapId = config.id;
		params.data.categories = config.types;

		invalidatePointsCache(marker.point.poi_category_id);

		Ponto.invoke(pontoBridgeModule, 'processData', params, function (point) {
			var markerObject,
				filter;

			// removes old marker from layer group
			if (markers.hasLayer(marker)) {
				markers.removeLayer(marker);
			}
			// adds new marker to layer group
			if (point) {
				invalidatePointsCache(point.poi_category_id);
				markerObject = addPointOnMap(point);

				filter = pointTypeFiltersContainer.querySelector('[data-point-type="' + point.poi_category_id + '"]');
				if (filter.className.indexOf('enabled') !== -1) {
					markerObject.openPopup();
				} else {
					addClass(markerObject._icon, 'hidden');
					addClass(markerObject._shadow, 'hidden');
				}
			}
		}, showPontoError, true);
	}

	/**
	 * @desc Expands / folds the filter box
	 * @param {HTMLElement} filterBox
	 */
	function toggleFilterBox(filterBox) {
		toggleClass(filterBox, 'shown-box');
		toggleClass(filterBox, 'hidden-box');
	}

	/**
	 * @desc Handles click event on the filterBox header
	 * @param {event} event
	 */
	function handleBoxHeaderClick(event) {
		if (event.target.id !== editPointTypesButtonId) {
			var filterBox = event.currentTarget.parentElement;
			toggleFilterBox(filterBox);
		}
	}

	/**
	 * Filters out POI types that should not be edited and caches the result
	 * uses editablePinTypes for caching
	 * @param {array} types
	 * @returns {array}
	 */
	function getEditablePointTypes(types) {
		return (editablePointTypes) ?
			editablePointTypes :
			editablePointTypes = types.filter(function (type) {
				return type.id !== config.catchAllCategoryId;
			});
	}

	/**
	 * @desc invokes Wikia Client edit POI category action
	 */
	function editPointTypes() {
		var params = {
				action: 'poiCategories',
				data: {
					mapId: config.id,
					poiCategories: getEditablePointTypes(config.types),
					mode: 'edit'
				}
			};

		Ponto.invoke(pontoBridgeModule, 'processData', params, function () {
			// TODO this is hotfix to display updated poi categories after editing. not elegant at all
			window.location = window.location + '&cb=' + (new Date()).getTime();
		}, showPontoError, true);
	}

	/**
	 * @desc shows error message for ponto communication
	 * @param {string} message - error message
	 * @todo figure out were to display them
	 */
	function showPontoError(message) {
		if (window.console) {
			window.console.error('Ponto Error', message);
		}
	}

	/**
	 * @desc This is temporary function to handle Ponto, not error-ing when there is no Ponto on the other side
	 * @todo Remove this once Ponto errors on missing pair
	 */
	function setupPontoTimeout() {
		setTimeout(function () {
			if (!isWikiaSet) {
				setUpHideButton();
				showAttributionStripe();
			}
		}, pontoTimeout);
	}

	/**
	 * @desc setup Ponto communication for Wikia Client
	 */
	function setupPontoWikiaClient() {
		if (window.self !== window.top) {
			Ponto.setTarget(Ponto.TARGET_IFRAME_PARENT, '*');
			Ponto.invoke(pontoBridgeModule, 'getWikiaSettings', null, setupWikiaOnlyOptions, showPontoError, false);
			setupPontoTimeout();
		} else {
			showAttributionStripe();
			Tracker.track('map', Tracker.ACTIONS.IMPRESSION, 'embedded-map-displayed',
				parseInt(config.id, 10));
		}
	}

	function showAttributionStripe() {
		var doc = window.document;
		addClass(doc.getElementById('wrapper'), 'embed');
		addClass(doc.getElementById('attr'), 'embed');
	}

	/**
	 * @desc setup map options available only when map displayed on Wikia page
	 * @param {object} options - {enableEdit: bool, skin: string}
	 */
	function setupWikiaOnlyOptions(options) {
		// @todo Remove this, once Ponto errors on missing pair
		isWikiaSet = true;

		if (options.enableEdit) {
			setUpEditOptions();
		}
		if (options.skin === 'wikiamobile') {
			addClass(body, 'wikia-mobile');
			setUpHideButton();
		} else {
			toggleFilterBox(document.querySelector('.filter-menu'));
		}
	}

	/**
	 * @desc adds hide button when on wikia mobile or embed code
	 */
	function setUpHideButton() {
		var hide = document.createElement('a');
		hide.innerHTML = msg('wikia-interactive-maps-hide-filter');
		hide.className = 'hide-button';
		document.querySelector('.filter-menu-header').appendChild(hide);
	}

	/**
	 * @desc setup edit options
	 */
	function setUpEditOptions() {
		var editPointTypesButton = doc.getElementById(editPointTypesButtonId),
			mapContainer = doc.getElementById(mapContainerId);

		// add POI handler
		map.on('draw:created', function (event) {
			editMarker(addTempMarker(event));
		});

		// edit POI handler
		mapContainer.addEventListener('click', function (event) {
			var target = event.target;

			if (target.className.indexOf('edit-poi-link') !== -1) {
				event.preventDefault();
				editMarker(getMarker(target.getAttribute('data-marker-id')));
			}
		}, false);

		// edit POI categories handler
		editPointTypesButton.addEventListener('click', editPointTypes, false);

		// show edit UI elements
		addClass(body, 'enable-edit');
		map.addControl(drawControls);
		map.addControl(embedMapCodeButton);
		Tracker.track('map', Tracker.ACTIONS.IMPRESSION, 'wikia-map-displayed', parseInt(config.id, 10));
	}

	/**
	 * @desc sends data to Wikia Client via ponto to show embed map code modal
	 */
	function embedMapCode() {
		var params = {
			action: 'embedMapCode',
			data: {
				mapId: config.id,
				iframeSrc: config.iframeSrc
			}
		};

		Ponto.invoke(pontoBridgeModule, 'processData', params, null, showPontoError, true);
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
		map.on('popupopen', function () {
			Tracker.track('map', Tracker.ACTIONS.CLICK_LINK_IMAGE, 'poi');
		});

		doc.addEventListener('click', function (event) {
			if (event.target.className.indexOf('poi-article-link') !== -1) {
				Tracker.track('map', Tracker.ACTIONS.CLICK_LINK_TEXT, 'poi-article');
			}
		});
	}

	/**
	 * @desc helper function that checks if the size of the screen smaller then popup size
	 * @TODO temporary fix to be removed ones mobile UI for map will be properly designed
	 * @returns {boolean}
	 */
	function isMobileScreenSize() {
		return window.outerWidth < 430 || (window.outerHeight < 430 && window.outerHeight < window.outerWidth);
	}

	/**
	 * @desc Create new map
	 */
	function createMap() {
		var zoomControl,
			defaultMinZoom,
			zoom,
			mapBounds,
			pointsList;

		setupInterfaceTranslations();

		defaultMinZoom = getMinZoomLevel(
			config.layer.maxZoom,
			Math.max(config.width, config.height),
			Math.max(
				Math.max(doc.documentElement.clientWidth, window.innerWidth || 0),
				Math.max(doc.documentElement.clientHeight, window.innerHeight || 0)
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

		if (config.hasOwnProperty('boundaries')) {
			mapBounds = new L.LatLngBounds(
				L.latLng(config.boundaries.south, config.boundaries.west),
				L.latLng(config.boundaries.north, config.boundaries.east)
			);

			map.setMaxBounds(mapBounds);
			map.on('popupclose', function () {
				map.panInsideBounds(mapBounds);
			});
			config.layer.bounds = mapBounds;
		}

		L.tileLayer(config.pathTemplate, config.layer).addTo(map);

		zoom = Math.max(config.zoom, defaultMinZoom);
		if (config.type !== 'custom') {
			zoom = config.defaultZoomForRealMap;
		}
		map.setView(
			L.latLng(config.latitude, config.longitude),
			zoom
		);

		zoomControl = L.control.zoom({
			position: uiControlsPosition
		});

		embedMapCodeButton = new L.Control.EmbedMapCode({
			position: uiControlsPosition,
			//TODO fix icon
			title: '< >',
			onClick: embedMapCode
		});

		map.addControl(zoomControl);

		// Change popup size for small mobile screens
		if (isMobileScreenSize()) {
			popupWidthWithPhoto = mobilePopupWidth;
			popupWidthWithoutPhoto = mobilePopupWidth;
		}

		setupPontoWikiaClient();
		setupPoints();
		setupClickTracking();
		markers.addTo(map);

		// Collect all the markers from the markers layer
		pointsList = Object.keys(markers._layers).map(function (k) {
			return markers._layers[k];
		});

		if (pointsList.length > 0) {
			// This is called as async because leaflet freezes when map.fitBounds is called directly
			setTimeout(function () {
				var group = new L.featureGroup(pointsList);
				map.fitBounds(group.getBounds().pad(autoZoomPadding));
			}, 1);
		}

		// Workaround for Safari translate3D bug with map panning and popups set to 'keep in view'
		L.Browser.webkit3d = false;
	}

	createMap();
})(window, window.L, window.Ponto, window.Tracker);
