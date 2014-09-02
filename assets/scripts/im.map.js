'use strict';

define('im.map', ['im.window', 'im.config', 'im.utils', 'im.leafletWrapper'], function (w, config, utils, L) {
	var doc = w.document,
		mapConfig = config.mapConfig,

		// reference to leaflet map object
		map,
		// leaflet layer for drawing controls
		drawControls;


	/**
	 * @desc Create new map
	 * @param {Function} cb - callback function to be triggered after map is setup
	 */
	function setupMap(cb) {
		createMapObject();
		setupTiles();
		setZoomControls();
		setupMapPosition();

		createDrawControls();

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
		return ((mapConfig.type === 'custom') ?
			Math.max(mapConfig.zoom, setDefaultMinZoom()) :
			mapConfig.defaultZoomForRealMap
		);
	}

	/**
	 * @desc helper function that sets zoom controls object for map
	 * @returns {Object} - leaflet zoom controls object
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

	function createDrawControls() {
		drawControls = new L.Control.Draw({
			position: config.uiControlsPosition,
			draw: {
				polyline: false,
				polygon: false,
				circle: false,
				rectangle: false
			}
		});
	}

	return {
		setupMap: setupMap,
		getMapObject: getMapObject
	};
});
