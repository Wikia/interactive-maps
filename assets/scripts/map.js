'use strict';

require(
	[
		'ponto',
		'tracker',
		'im.window',
		'im.leafletWrapper',
		'im.config',
		'im.renderUI',
		'im.i18n',
		'im.utils',
		'im.poi',
		'im.poiCategory',
		'im.poiCollection'
	],
	function (ponto, tracker, w, L, config, renderUI, i18n, utils, poi, poiCategory, poiCollection) {

		var doc = w.document,
			body = doc.body,
			wrapper = doc.getElementById('wrapper'),

		// leaflet map object
			map,
		// leaflet layer for storing markers
			markers = new L.LayerGroup(),
		// leaflet layer for drawing controls
			drawControls = new L.Control.Draw({
				position: config.uiControlsPosition,
				draw: {
					polyline: false,
					polygon: false,
					circle: false,
					rectangle: false
				}
			}),

			mapConfig = config.mapConfig,
			embedMapCodeButton,
			pointTypeFiltersContainer,
			pointIcons = {},
			pointTypes = {},

		// @todo Remove these once Ponto is fixed
			isWikiaSet = false;

		/**
		 * @desc Toggles visibility of points corresponding with clicked filter
		 * @param {Element} filterClicked - Filter element that was clicked
		 */
		function togglePoints(filterClicked) {
			var pointType = parseInt(filterClicked.getAttribute('data-point-type'), 10),
				points = poiCollection.getPoiByCategory(pointType),
				pointsLength = points.length,
				i;

			for (i = 0; i < pointsLength; i++) {
				utils.toggleClass(points[i], 'hidden');
			}
		}

		/**
		 * @desc Toggles state of point type filter
		 * @param {Element} filterClicked - Filter element that was clicked
		 */
		function togglePointTypeFilter(filterClicked) {
			tracker.track(
				'map',
				tracker.ACTIONS.CLICK,
				'poi-category-filter',
				parseInt(filterClicked.getAttribute('data-point-type'), 10)
			);

			utils.toggleClass(filterClicked, 'enabled');
		}

		/**
		 * @desc Toggles state of "All pin types" filter
		 */
		function toggleAllPointTypesFilter() {
			var allPointTypesFilter = doc.getElementById(config.allPointTypesFilterId),
				enabled = 'enabled',
				filtersEnabledLength = pointTypeFiltersContainer.getElementsByClassName('point-type enabled').length;

			if (pointTypes.length === filtersEnabledLength &&
				allPointTypesFilter.className.indexOf(enabled) === -1){
				utils.addClass(allPointTypesFilter, enabled);
			} else {
				utils.removeClass(allPointTypesFilter, enabled);
			}

		}

		/**
		 * @desc Handles click on "All pin types" filter
		 */
		function allPointTypesFilterClickHandler() {
			var allPointTypesFilter = doc.getElementById(config.allPointTypesFilterId),
				filters = pointTypeFiltersContainer.getElementsByClassName('point-type'),
				filtersLength = filters.length,
				enabled = allPointTypesFilter.className.indexOf('enabled') === -1,
				i;

			for (i = 0; i < filtersLength; i++) {
				if (enabled) {
					utils.addClass(filters[i], 'enabled');
				} else {
					utils.removeClass(filters[i], 'enabled');
				}
			}

			toggleAllPointTypesFilter();
			togglePoints(allPointTypesFilter);

			tracker.track('map', tracker.ACTIONS.CLICK, 'poi-category-filter', 0);
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
		 * @param {boolean=} isExpanded - optional param for inital state of filter box if true it wil be expanded
		 * @returns {object}
		 */
		function createPointTypeFiltersContainer(container, isExpanded) {
			var div = doc.createElement('div'),
				header = doc.createElement('div'),
				headerTitle = doc.createElement('span'),
				headerEdit = doc.createElement('span'),
				ul = doc.createElement('ul'),
				li = doc.createElement('li');

			div.setAttribute('id', 'filterMenu');
			div.setAttribute('class', 'filter-menu ' + (isExpanded ? 'shown' : 'hidden') + '-box');

			header.setAttribute('class', 'filter-menu-header');

			headerTitle.appendChild(doc.createTextNode(i18n.msg('wikia-interactive-maps-filters')));
			header.appendChild(headerTitle);

			headerEdit.setAttribute('id', config.editPointTypesButtonId);
			headerEdit.setAttribute('class', 'edit-point-types');
			headerEdit.appendChild(doc.createTextNode(i18n.msg('wikia-interactive-maps-edit-pin-types')));
			header.appendChild(headerEdit);

			div.appendChild(header);

			ul.setAttribute('id', config.pointTypeFiltersContainerId);
			ul.setAttribute('class', 'point-types');

			li.setAttribute('id', 'allPointTypes');
			li.setAttribute('class', 'enabled');
			li.setAttribute('data-point-type', '0');
			li.appendChild(doc.createTextNode(i18n.msg('wikia-interactive-maps-all-pin-types')));
			ul.appendChild(li);
			div.appendChild(ul);
			container.appendChild(div);
			return ul;
		}

		/**
		 * @desc Create points and filters for them
		 * @param {array} types - poi categories
		 * @param {boolean} isExpanded - flag that indicates if filter box should be initially expanded
		 */
		function setupPoisAndFilters(types, isExpanded) {
			var pointTypeFiltersHtml = '';

			pointTypes = types;

			pointTypes.forEach(function (pointType) {
				poiCategory.setupPoiCategoryIcon(pointType, pointIcons);
				pointTypeFiltersHtml += renderUI.buildPointTypeFilterHtml(pointType);
			});

			pointTypeFiltersContainer = createPointTypeFiltersContainer(wrapper, isExpanded);
			pointTypeFiltersContainer.innerHTML += pointTypeFiltersHtml;

			mapConfig.points.forEach(function(point) {
				poi.addPoiToMap(point, pointIcons[point.poi_category_id], markers);
			});

			pointTypeFiltersContainer.addEventListener('click', pointTypeFiltersContainerClickHandler, false);
			document.querySelector('.filter-menu-header').addEventListener('click', handleBoxHeaderClick);
		}

		/**
		 * @desc sends data to Wikia Client via ponto to add / edit POI
		 * @param {object} marker - marker object
		 * @todo: should be moved to im.poi.js
		 */
		function editMarker(marker) {
			var params = {
				action: 'editPOI',
				data: marker.point
			};

			params.data.mapId = mapConfig.id;
			params.data.categories = mapConfig.types;

			poiCollection.invalidatePoiCache(marker.point.poi_category_id);

			ponto.invoke(config.pontoBridgeModule, 'processData', params, function (point) {
				var markerObject,
					filter;

				// removes old marker from layer group
				if (markers.hasLayer(marker)) {
					markers.removeLayer(marker);
				}
				// adds new marker to layer group
				if (point) {
					poiCollection.invalidatePoiCache(point.poi_category_id);
					markerObject = poi.addPoiToMap(point, pointIcons[point.poi_category_id], markers);

					filter = pointTypeFiltersContainer.querySelector('[data-point-type="' + point.poi_category_id +
						'"]');
					if (filter.className.indexOf('enabled') !== -1) {
						markerObject.openPopup();
					} else {
						utils.addClass(markerObject._icon, 'hidden');
						utils.addClass(markerObject._shadow, 'hidden');
					}
				}
			}, showPontoError, true);
		}

		/**
		 * @desc Expands / folds the filter box
		 * @param {HTMLElement} filterBox
		 */
		function toggleFilterBox(filterBox) {
			utils.toggleClass(filterBox, 'shown-box');
			utils.toggleClass(filterBox, 'hidden-box');
		}

		/**
		 * @desc Handles click event on the filterBox header
		 * @param {event} event
		 */
		function handleBoxHeaderClick(event) {
			if (event.target.id !== config.editPointTypesButtonId) {
				var filterBox = event.currentTarget.parentElement;
				toggleFilterBox(filterBox);
			}
		}

		/**
		 * @desc invokes Wikia Client edit POI category action
		 */
		function editPointTypes() {
			var params = {
				action: 'poiCategories',
				data: {
					mapId: mapConfig.id,
					poiCategories: poiCategory.getEditablePoiCategories(mapConfig.types),
					mode: 'edit'
				}
			};

			ponto.invoke(config.pontoBridgeModule, 'processData', params, function (types) {
				wrapper.removeChild(doc.getElementById('filterMenu'));
				map.removeLayer(markers);

				markers = new L.LayerGroup();
				setupPoisAndFilters(types, true);
				markers.addTo(map);

			}, showPontoError, true);
		}

		/**
		 * @desc shows error message for ponto communication
		 * @param {string} message - error message
		 * @todo figure out were to display them
		 */
		function showPontoError(message) {
			if (w.console) {
				w.console.error('Ponto Error', message);
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
			}, config.pontoTimeout);
		}

		/**
		 * @desc setup Ponto communication for Wikia Client
		 */
		function setupPontoWikiaClient() {
			if (w.self !== w.top) {
				ponto.setTarget(ponto.TARGET_IFRAME_PARENT, '*');
				ponto.invoke(config.pontoBridgeModule, 'getWikiaSettings', null, setupWikiaOnlyOptions,
					showPontoError, false);
				setupPontoTimeout();
			} else {
				showAttributionStripe();
				tracker.track('map', tracker.ACTIONS.IMPRESSION, 'embedded-map-displayed',
					parseInt(mapConfig.id, 10));
			}
		}

		/**
		 * @desc shows attribution stripe at the bottom of the map
		 */
		function showAttributionStripe() {
			utils.addClass(doc.getElementById('wrapper'), 'embed');
			utils.addClass(doc.getElementById('attr'), 'embed');
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
				utils.addClass(body, 'wikia-mobile');
				setUpHideButton();
			} else {
				toggleFilterBox(doc.querySelector('.filter-menu'));
			}
		}

		/**
		 * @desc adds hide button when on wikia mobile or embed code
		 */
		function setUpHideButton() {
			var hide = document.createElement('a');
			hide.innerHTML = i18n.msg('wikia-interactive-maps-hide-filter');
			hide.className = 'hide-button';
			document.querySelector('.filter-menu-header').appendChild(hide);
		}

		/**
		 * @desc setup edit options
		 */
		function setUpEditOptions() {
			// add POI handler
			map.on('draw:created', function (event) {
				editMarker(poi.createTempPoiMarker(event));
			});

			// edit POI handler
			wrapper.addEventListener('click', function (event) {
				var target = event.target;

				if (target.className.indexOf('edit-poi-link') !== -1) {
					event.preventDefault();
					editMarker(poi.getPoiMarker(target.getAttribute('data-marker-id')));
				}

				if (target.id === config.editPointTypesButtonId) {
					editPointTypes();
				}
			}, false);

			// show edit UI elements
			utils.addClass(body, 'enable-edit');
			map.addControl(drawControls);
			map.addControl(embedMapCodeButton);
			tracker.track('map', tracker.ACTIONS.IMPRESSION, 'wikia-map-displayed', parseInt(mapConfig.id, 10));
		}

		/**
		 * @desc sends data to Wikia Client via ponto to show embed map code modal
		 */
		function embedMapCode() {
			var params = {
				action: 'embedMapCode',
				data: {
					mapId: mapConfig.id,
					iframeSrc: mapConfig.iframeSrc
				}
			};

			ponto.invoke(config.pontoBridgeModule, 'processData', params, null, showPontoError, true);
		}

		/**
		 * @desc Sets up the interface translations
		 */
		function setupInterfaceTranslations() {
			L.drawLocal.draw.handlers.marker.tooltip.start = i18n.msg('wikia-interactive-maps-create-marker-handler');
			L.drawLocal.draw.toolbar.buttons.marker = i18n.msg('wikia-interactive-maps-create-marker-tooltip');
			L.drawLocal.draw.toolbar.actions.text = i18n.msg('wikia-interactive-maps-create-marker-cancel');
		}

		/**
		 * @desc Sets up click tracking for service
		 */
		function setupClickTracking() {
			map.on('popupopen', function () {
				tracker.track('map', tracker.ACTIONS.CLICK_LINK_IMAGE, 'poi');
			});

			doc.addEventListener('click', function (event) {
				if (event.target.className.indexOf('poi-article-link') !== -1) {
					tracker.track('map', tracker.ACTIONS.CLICK_LINK_TEXT, 'poi-article');
				}
			});
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

			defaultMinZoom = utils.getMinZoomLevel(
				mapConfig.layer.maxZoom,
				Math.max(mapConfig.width, mapConfig.height),
				Math.max(
					Math.max(doc.documentElement.clientWidth, w.innerWidth || 0),
					Math.max(doc.documentElement.clientHeight, w.innerHeight || 0)
				)
			);

			if (mapConfig.imagesPath) {
				L.Icon.Default.imagePath = mapConfig.imagesPath;
			}

			map = L.map(config.mapContainerId, {
				minZoom: mapConfig.layer.minZoom,
				maxZoom: mapConfig.layer.maxZoom,
				zoomControl: false
			});

			map.attributionControl.setPrefix(false);

			if (mapConfig.hasOwnProperty('boundaries')) {
				mapBounds = new L.LatLngBounds(
					L.latLng(mapConfig.boundaries.south, mapConfig.boundaries.west),
					L.latLng(mapConfig.boundaries.north, mapConfig.boundaries.east)
				);

				map.setMaxBounds(mapBounds);
				map.on('popupclose', function () {
					map.panInsideBounds(mapBounds);
				});
				mapConfig.layer.bounds = mapBounds;
			}

			L.tileLayer(mapConfig.pathTemplate, mapConfig.layer).addTo(map);

			zoom = Math.max(mapConfig.zoom, defaultMinZoom);
			if (mapConfig.type !== 'custom') {
				zoom = mapConfig.defaultZoomForRealMap;
			}
			map.setView(
				L.latLng(mapConfig.latitude, mapConfig.longitude),
				zoom
			);

			zoomControl = L.control.zoom({
				position: config.uiControlsPosition
			});

			embedMapCodeButton = new L.Control.EmbedMapCode({
				position: config.uiControlsPosition,
				//TODO fix icon
				title: '< >',
				onClick: embedMapCode
			});

			map.addControl(zoomControl);

			// Change popup size for small mobile screens
			if (utils.isMobileScreenSize()) {
				config.popupWidthWithPhoto = config.mobilePopupWidth;
				config.popupWidthWithoutPhoto = config.mobilePopupWidth;
			}

			setupPontoWikiaClient();
			setupPoisAndFilters(mapConfig.types);
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
					map.fitBounds(group.getBounds().pad(config.autoZoomPadding));
				}, 1);
			}

			// Workaround for Safari translate3D bug with map panning and popups set to 'keep in view'
			L.Browser.webkit3d = false;
		}

		createMap();
	}
);
