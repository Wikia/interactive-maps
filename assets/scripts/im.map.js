define(
	'im.map',
	['im.window', 'im.config', 'im.utils', 'im.leafletWrapper', 'im.i18n'],
	function (w, config, utils, L, i18n) {
		'use strict';
		var doc = w.document,
			mapConfig = config.mapConfig,
			// reference to leaflet map object
			map;

		/**
		 * @desc Create new map
		 * @param {Function} cb - callback function to be triggered after map is setup
		 */
		function setupMap(cb) {
			createMapObject();
			setupTiles();
			setZoomControls();
			setupMapPosition();
			setupAttributionStripe();

			cb(map);
		}

		/**
		 * @desc returns leaflet map object or undefined is map is not setup
		 * @returns {Object|undefined} - leaflet map object
		 */
		function getMapObject() {
			return map;
		}

		/**
		 * @desc creates contribution UI controls and adds it to map
		 */
		function createContributionControls() {
			map.addControl(createDrawControls());
			map.addControl(createEmbedMapCodeControls());
		}

		/**
		 * @desc Shows attribution stripe if needed
		 */
		function setupAttributionStripe() {
			if (!mapConfig.hideAttr) {
				utils.addClass(doc.getElementById('wrapper'), 'embed');
				utils.addClass(doc.getElementById('attr'), 'embed');
			}
		}

		/**
		 * @desc set map zoom level so all pois are visible
		 * @param {Array} pois - array of poi markers
		 */
		function setAllPoisInView(pois) {
			var group = new L.featureGroup(pois);

			// This is called as async because leaflet freezes when map.fitBounds is called directly
			setTimeout(function () {
				map.fitBounds(
					group
						.getBounds()
						.pad(config.autoZoomPadding)
				);
			}, 1);
		}

		/**
		 * @desc returns map boundaries
		 * @returns {Object|Undefined}
		 */
		function getMapBoundaries() {
			return config.mapConfig.boundaries;
		}

		/**
		 * @desc helper function that sets minimal zoom level
		 * @returns {number}
		 */
		function setDefaultMinZoom() {
			return utils.getMinZoomLevel(
				mapConfig.layer.maxZoom,
				Math.max(mapConfig.width, mapConfig.height),
				Math.max(
					Math.max(doc.documentElement.clientWidth, w.innerWidth || 0),
					Math.max(doc.documentElement.clientHeight, w.innerHeight || 0)
				)
			);
		}

		/**
		 * @desc helper function that sets map initial zoom level
		 * @returns {number}
		 */
		function setInitialZoom() {
			return (
				mapConfig.type === 'custom' ?
				Math.max(mapConfig.zoom, setDefaultMinZoom()) :
				mapConfig.defaultZoomForRealMap
			);
		}

		/**
		 * @desc helper function that sets zoom controls object for map
		 */
		function setZoomControls() {
			map.addControl(
				L.control.zoom({
					position: config.uiControlsPosition
				})
			);
		}

		/**
		 * @desc helper function that creates leaflet map object
		 */
		function createMapObject() {
			map = L.map(config.mapContainerId, {
				minZoom: mapConfig.layer.minZoom,
				maxZoom: mapConfig.layer.maxZoom,
				zoomControl: false
			});

			map.attributionControl.setPrefix(false);
		}

		/**
		 * @desc helper function that adds tiles layer map
		 */
		function setupTiles() {
			var options = mapConfig.layer;

			if (mapConfig.hasOwnProperty('boundaries')) {
				options.bounds = setMapBoundaries();
			}

			L.tileLayer(mapConfig.pathTemplate, options).addTo(map);
		}

		/**
		 * @desc helper function that returns leaflet map bounds object
		 * @returns {Object}
		 */
		function setMapBoundaries() {
			return new L.LatLngBounds(
				L.latLng(mapConfig.boundaries.south, mapConfig.boundaries.west),
				L.latLng(mapConfig.boundaries.north, mapConfig.boundaries.east)
			);
		}

		/**
		 * @desc helper function that sets map initial center location and zoom level
		 */
		function setupMapPosition() {
			map.setView(
				L.latLng(mapConfig.latitude, mapConfig.longitude),
				setInitialZoom()
			);
		}

		/**
		 * @desc creates Leaflet Draw controls for adding new markers
		 * @returns {Object} - new instance of L.Control.Draw
		 */
		function createDrawControls() {
			setupDrawInterfaceTranslations();

			return new L.Control.Draw({
				position: config.uiControlsPosition,
				draw: {
					polyline: false,
					polygon: false,
					circle: false,
					rectangle: false
				}
			});
		}

		/**
		 * @desc - creates Leaflet controls for embed map code
		 * @returns {Object} - new instance of L.Control.EmbedMapCode
		 */
		function createEmbedMapCodeControls() {
			return new L.Control.EmbedMapCode({
				position: config.uiControlsPosition,
				//TODO fix icon
				title: '< >',
				onClick: function () {
					map.fire('embedMapCode:clicked');
				}
			});
		}

		/**
		 * @desc Sets up the interface translations
		 */
		function setupDrawInterfaceTranslations() {
			L.drawLocal.draw.handlers.marker.tooltip.start = i18n.msg('wikia-interactive-maps-create-marker-handler');
			L.drawLocal.draw.toolbar.buttons.marker = i18n.msg('wikia-interactive-maps-create-marker-tooltip');
			L.drawLocal.draw.toolbar.actions.text = i18n.msg('wikia-interactive-maps-create-marker-cancel');
		}

		return {
			setupMap: setupMap,
			getMapObject: getMapObject,
			createContributionControls: createContributionControls,
			setAllPoisInView: setAllPoisInView,
			getMapBoundaries: getMapBoundaries
		};
	}
);
