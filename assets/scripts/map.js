'use strict';

require(
	[
		'ponto',
		'tracker',
		'im.window',
		'im.leafletWrapper',
		'im.config',
		'im.pontoWikiaBridge',
		'im.renderUI',
		'im.i18n',
		'im.utils',
		'im.map',
		'im.poi',
		'im.poiCategory',
		'im.poiCollection'
	],
	function (ponto, tracker, w, L, config, pontoWikiaBridge, renderUI, i18n, utils, mapModule, poiModule,
		poiCategoryModule, poiCollectionModule) {

		var doc = w.document,
			body = doc.body,
			wrapper = doc.getElementById('wrapper'),

		// leaflet map object
			map,
		// leaflet layer for storing markers
			markers = new L.LayerGroup(),
			mapConfig = config.mapConfig,
			pointTypeFiltersContainer,
			pointTypes = {};

		/**
		 * @desc Toggles visibility of points corresponding with clicked filter
		 * @param {Element} filterClicked - Filter element that was clicked
		 */
		function togglePoints(filterClicked) {
			var pointType = parseInt(filterClicked.getAttribute('data-point-type'), 10),
				points = poiCollectionModule.getPoiByCategory(pointType),
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

			if (pointTypes.length === filtersEnabledLength && !utils.hasClass(allPointTypesFilter, enabled)){
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
				points = poiCollectionModule.getPoiByCategory(0),
				pointsLength = points.length,
				disabled = !utils.hasClass(allPointTypesFilter, 'enabled'),
				i;

			// enable/disable all filters
			for (i = 0; i < filtersLength; i++) {
				if (disabled) {
					utils.addClass(filters[i], 'enabled');
				} else {
					utils.removeClass(filters[i], 'enabled');
				}
			}

			// show/hide all points
			for (i = 0; i < pointsLength; i++) {
				if (disabled) {
					utils.removeClass(points[i], 'hidden');
				} else {
					utils.addClass(points[i], 'hidden');
				}
			}

			toggleAllPointTypesFilter();

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
		 * @desc Create points and filters for them
		 * @param {object} pois
		 * @param {Array} categories - poi categories
		 * @param {Boolean=} isFilterBoxExpanded - flag that indicates if filter box should be initially expanded
		 */
		function setupPoisAndFilters(pois, categories, isFilterBoxExpanded) {
			var pointTypeFiltersHtml = '';

			pointTypes = categories;

			// create filter box
			pointTypeFiltersContainer = createPointTypeFiltersContainer(wrapper, isFilterBoxExpanded);

			// create filters
			categories.forEach(function (category) {
				poiCategoryModule.setupPoiCategoryIcon(category);
				pointTypeFiltersHtml += renderUI.buildPointTypeFilterHtml(category);
			});

			// add filters to filter box
			pointTypeFiltersContainer.innerHTML += pointTypeFiltersHtml;

			// attach filter box event handlers
			pointTypeFiltersContainer.addEventListener('click', pointTypeFiltersContainerClickHandler, false);
			doc.getElementsByClassName('filter-menu-header')[0].addEventListener('click', handleBoxHeaderClick);

			// create poi markers
			Object.keys(pois).forEach(function (id) {
				var poi = pois[id];

				poiModule.addPoiToMap(poi, poiCategoryModule.getPoiCategoryIcon(poi.poi_category_id), markers);
			});
		}

		/**
		 * @desc adds hide button when on wikia mobile or embed code
		 */
		function setUpHideButton() {
			var hide = doc.createElement('a');
			hide.innerHTML = i18n.msg('wikia-interactive-maps-hide-filter');
			hide.className = 'hide-button';
			doc.getElementsByClassName('filter-menu-header')[0].appendChild(hide);
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

			pontoWikiaBridge.postMessage('processData', params, null, true);
		}

		/**
		 * @desc sends data to Wikia Client via ponto to add / edit POI
		 * @param {object} marker - marker object
		 * @todo: should be moved to im.poi.js
		 */
		function editMarker(marker) {
			var params = {
				action: 'poi',
				data: marker.point
			};

			// extend data object
			params.data.mapId = mapConfig.id;
			params.data.categories = poiCategoryModule.getEditablePoiCategories();

			pontoWikiaBridge.postMessage('processData', params, function (point) {
				var markerObject,
					filter;

				poiCollectionModule.removeFromState(marker.point.id);
				poiCollectionModule.invalidatePoiCache(marker.point.poi_category_id);

				// removes old marker from layer group
				if (markers.hasLayer(marker)) {
					markers.removeLayer(marker);
				}

				// adds new poi marker to layer group and poi to state
				if (point) {
					poiCollectionModule.addToState(point);
					markerObject = poiModule.addPoiToMap(
						point, poiCategoryModule.getPoiCategoryIcon(point.poi_category_id), markers);

					filter = pointTypeFiltersContainer.querySelector(
						'[data-point-type="' +
						point.poi_category_id +
						'"]'
					);
					if (utils.hasClass(filter, 'enabled')) {
						markerObject.openPopup();
					} else {
						utils.addClass(markerObject._icon, 'hidden');
						utils.addClass(markerObject._shadow, 'hidden');
					}
				}
			}, true);
		}

		/**
		 * @desc invokes Wikia Client edit POI category action
		 */
		function editPointTypes() {
			var params = {
				action: 'poiCategories',
				data: {
					mapId: mapConfig.id,
					poiCategories: poiCategoryModule.getEditablePoiCategories(),
					mode: 'edit'
				}
			};

			pontoWikiaBridge.postMessage('processData', params, function (categories) {
				updatePoisFromDeletedCategories(categories);
				updatePoiCategories(categories);
				poiCollectionModule.resetPoiCache();

				// remove old filter box
				wrapper.removeChild(doc.getElementById('filterMenu'));
				// remove poi markers
				map.removeLayer(markers);

				// recreate poi markers and filter box
				markers = new L.LayerGroup();
				setupPoisAndFilters(poiCollectionModule.getPoiState(), poiCategoryModule.getAllPoiCategories(), true);
				markers.addTo(map);
			}, true);
		}

		/**
		 * @desc helper function which updates category of pois that belongs to deleted category - to "other"
		 * @param {Array} categories - updated poi categories
		 */
		function updatePoisFromDeletedCategories(categories) {
			var updatedCategoryIds = {},
				pois = poiCollectionModule.getPoiState();

			categories.forEach(function (category) {
				updatedCategoryIds[category.id] = true;
			});

			Object.keys(pois).forEach(function (key) {
				var categoryId = pois[key].poi_category_id;

				if (!updatedCategoryIds.hasOwnProperty(categoryId)) {
					pois[key].poi_category_id = mapConfig.catchAllCategoryId;
					poiCollectionModule.updatePoiInState(pois[key]);
				}
			});
		}

		/**
		 * @desc helper function which updates poi categories for this map
		 * @param {Array} categories - updated poi categories
		 */
		function updatePoiCategories(categories) {
			var pois = poiCollectionModule.getPoiState(),
				poiIds = Object.keys(pois),
				length = poiIds.length,
				i;

			// check if other category should be added (any pois belongs to this category)
			for (i = 0; i < length; i++) {
				if (pois[poiIds[i]].poi_category_id === mapConfig.catchAllCategoryId) {
					categories.push(
						poiCategoryModule.createPoiCategory(
							mapConfig.catchAllCategoryId,
							i18n.msg('wikia-interactive-maps-default-poi-category')
						)
					);
					break;
				}
			}

			poiCategoryModule.setupPoiCategories(categories);
		}

		/**
		 * @desc setup Ponto communication for Wikia Client
		 */
		function setupPontoWikiaClient() {
			if (w.self !== w.top) {
				ponto.setTarget(ponto.TARGET_IFRAME_PARENT, '*');
				pontoWikiaBridge.postMessage('getWikiaSettings', null, setupWikiaOnlyOptions, false);
			} else {
				tracker.track(
					'map', tracker.ACTIONS.IMPRESSION, 'embedded-map-displayed',
					parseInt(mapConfig.id, 10)
				);
			}
		}

		/**
		 * @desc setup map options available only when map displayed on Wikia page
		 * @param {object} options - {cityId: int, mobile: bool, skin: string}
		 */
		function setupWikiaOnlyOptions(options) {
			var mapId = parseInt(mapConfig.id, 10);

			if (options.mobile) {
				utils.addClass(body, 'wikia-mobile');
				setUpHideButton();
			} else if (mapConfig.city_id === options.cityId) {
				setupContributionOptions();
				tracker.track('map', tracker.ACTIONS.IMPRESSION, 'wikia-map-displayed', mapId);
			} else {
				tracker.track('map', tracker.ACTIONS.IMPRESSION, 'wikia-foreign-map-displayed', mapId);
			}

			if (!options.mobile) {
				toggleFilterBox(document.querySelector('.filter-menu'));
			}
		}

		/**
		 * @desc setup edit options
		 */
		function setupContributionOptions() {
			// attach event handlers
			map
				.on('draw:created', function (event) {
				editMarker(poiModule.createTempPoiMarker(event));
				})
				.on('embedMapCode:clicked', embedMapCode);

			wrapper.addEventListener('click', function (event) {
				var target = event.target;

				if (utils.hasClass(target, 'edit-poi-link')) {
					event.preventDefault();
					editMarker(poiModule.getPoiMarker(markers, target.getAttribute('data-marker-id')));
				}

				if (target.id === config.editPointTypesButtonId) {
					editPointTypes();
				}
			}, false);

			// show / create edit UI elements
			utils.addClass(body, 'enable-edit');
			mapModule.createContributionControls();
		}

		/**
		 * @desc Sets up click tracking for service
		 */
		function setupClickTracking() {
			map.on('popupopen', function () {
				tracker.track('map', tracker.ACTIONS.CLICK_LINK_IMAGE, 'poi');
			});

			doc.addEventListener('click', function (event) {
				if (utils.hasClass(event.target, 'poi-article-link')) {
					tracker.track('map', tracker.ACTIONS.CLICK_LINK_TEXT, 'poi-article');
				}
			});
		}

		mapModule.setupMap(function (mapObject) {
			// placeholder for array of poi markers
			var poiMarkersList;

			// set reference to map object
			map = mapObject;

			if (mapConfig.imagesPath) {
				L.Icon.Default.imagePath = mapConfig.imagesPath;
			}

			// Change popup size for small mobile screens
			if (utils.isMobileScreenSize()) {
				config.popupWidthWithPhoto = config.mobilePopupWidth;
				config.popupWidthWithoutPhoto = config.mobilePopupWidth;
			}

			setupPontoWikiaClient();
			setupClickTracking();

			poiCollectionModule.setupInitialPoiState(mapConfig.points);
			poiCategoryModule.setupPoiCategories(mapConfig.types);
			setupPoisAndFilters(poiCollectionModule.getPoiState(), poiCategoryModule.getAllPoiCategories());

			markers.addTo(map);

			// Collect all the markers from the markers layer
			poiMarkersList = Object.keys(markers._layers).map(function (k) {
				return markers._layers[k];
			});

			if (poiMarkersList.length) {
				mapModule.setAllPoisInView(poiMarkersList);
			}
		});
	}
);
