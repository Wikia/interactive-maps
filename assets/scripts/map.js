'use strict';

require(
	[
		'ponto',
		'tracker',
		'im.window',
		'im.leafletWrapper',
		'im.config',
		'im.pontoWikiaBridge',
		'im.pontoWikiaAppsBridge',
		'im.i18n',
		'im.utils',
		'im.map',
		'im.poi',
		'im.poiCategory',
		'im.poiCollection',
		'im.filterBox'
	],
	function (
		ponto,
		tracker,
		w,
		L,
		config,
		pontoWikiaBridge,
		pontoWikiaAppsBridge,
		i18n,
		utils,
		mapModule,
		poiModule,
		poiCategoryModule,
		poiCollectionModule,
		filterBox
	) {

		var doc = w.document,
			body = doc.body,
			wrapper = doc.getElementById('wrapper'),

		// leaflet map object
			map,
		// leaflet layer for storing markers
			markers = new L.LayerGroup(),
			mapConfig = config.mapConfig;

		/**
		 * @desc Create points and filters for them
		 * @param {object} pois
		 * @param {Array} categories - poi categories
		 * @param {Boolean=} isFilterBoxExpanded - flag that indicates if filter box should be initially expanded
		 */
		function setupPoisAndFilters(pois, categories, isFilterBoxExpanded) {
			// setup filters icons
			categories.forEach(function (category) {
				poiCategoryModule.setupPoiCategoryIcon(category);
			});

			// setup filter box
			filterBox.setupFilterBox(wrapper, categories, isFilterBoxExpanded);

			// create poi markers
			Object.keys(pois).forEach(function (id) {
				var poi = pois[id];

				poiModule.addPoiToMap(poi, poiCategoryModule.getPoiCategoryIcon(poi.poi_category_id), markers);
			});
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

					filter = filterBox.getFiltersContainer().querySelector(
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

				// set special article link behavior for map embedded in wikia mobile apps
				if (config.mapConfig.isEmbeddedInWikiaApp) {
					pontoWikiaAppsBridge.setupArticleLinks();
				}
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
		 * @desc setup map options available only when map displayed on Wikia page
		 * @param {object} options - {cityId: int, mobile: bool, skin: string}
		 */
		function setupWikiaOnlyOptions(options) {
			var mapId = parseInt(mapConfig.id, 10);

			if (options.mobile) {
				utils.addClass(body, 'wikia-mobile');
				filterBox.setUpHideButton();
			} else if (mapConfig.city_id === options.cityId) {
				setupContributionOptions();
				tracker.track('map', tracker.ACTIONS.IMPRESSION, 'wikia-map-displayed', mapId);
			} else {
				tracker.track('map', tracker.ACTIONS.IMPRESSION, 'wikia-foreign-map-displayed', mapId);
			}

			if (!options.mobile) {
				filterBox.toggleFilterBox(document.getElementsByClassName('filter-menu')[0]);
			}
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

			poiCollectionModule.setupInitialPoiState(mapConfig.pois);
			poiCategoryModule.setupPoiCategories(mapConfig.poi_categories);
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
