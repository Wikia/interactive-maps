(function (window, L) {
	'use strict';

	var className = 'leaflet-control-embed-map-code';

	L.Control.EmbedMapCode = L.Control.extend({
		options: {
			position: 'topleft'
		},

		/**
		 * @desc fires ones EmbedMapCode control is initialized
		 * @param {object} options - button configuration object with 'title' {string} and 'onClick' {function} - handler
		 */
		initialize: function (options) {
			this._config = {};
			this._setConfig(options || {});

			// overwrite default position
			if (options.position) {
				this.options.position = options.position;
			}
		},

		/**
		 * @desc fired ones EmbedMapCode control is added to map
		 * @param {object} map - leaflet map object
		 * @returns {Element} - HTML element for container
		 */
		onAdd: function (map) {
			var container = L.DomUtil.create('div', className);

			this._map = map;
			this._container = container;

			this._createButton();

			return this._container;
		},

		/**
		 * @desc sets config for embed code button
		 * @param {object} options - initialization options
		 * @private
		 */
		_setConfig: function(options) {
			this._config = {
				onClick: options.onClick || function() {},
				title: options.title || 'click me!'
			};
		},

		/**
		 * @desc creates embed code button markup and binds events
		 * @returns {object} - Leaflet Button object
		 * @private
		 */
		_createButton: function() {
			var button = this._createMarkup();

			this._bindEvent(button);

			return button;
		},

		/**
		 * @desc creates embed code button markup
		 * @returns {object} - Leaflet Button object
		 * @private
		 */
		_createMarkup: function() {
			var button = L.DomUtil.create('div', className + '-button leaflet-bar', this._container),
				link = L.DomUtil.create('a', className + '-button', button);

			link.title = this._config.title;
			link.href = '#';
			link.textContent = this._config.title;

			return button;
		},

		/**
		 * @desc binds events to embed code button
		 * @param {object} button - Leaflet Button object
		 * @private
		 */
		_bindEvent: function(button) {
			L.DomEvent
				.addListener(button, 'click', L.DomEvent.stop)
				.addListener(button, 'click', this._config.onClick, this);

			L.DomEvent.disableClickPropagation(button);
		}
	});
})(window, window.L);
