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

			this._createButton(this._config);

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
		 * @param {object} config - config for embed code button
		 * @returns {Element} - HTML element for embed code button
		 * @private
		 */
		_createButton: function (config) {
			var button = this._createMarkup(config, this._container);

			this._bindEvent(config, button);

			return button;
		},

		/**
		 * @desc creates embed code button markup
		 * @param {object} config - config for embed code button
		 * @param {Element} container - HTML element for button container
		 * @returns {Element} - HTML element for embed code button
		 * @private
		 */
		_createMarkup: function(config, container) {
			var button = L.DomUtil.create('div', className + '-button leaflet-bar', container),
				link = L.DomUtil.create('a', className + '-button', button);

			link.title = config.title;
			link.href = '#';
			link.textContent = config.title;

			return button;
		},

		/**
		 * @desc binds events to embed code button
		 * @param {object} config - config for embed code button
		 * @param {Element} button - HTML element for embed code button
		 * @private
		 */
		_bindEvent: function(config, button) {
			L.DomEvent
				.addListener(button, 'click', L.DomEvent.stop)
				.addListener(button, 'click', config.onClick, this);

			L.DomEvent.disableClickPropagation(button);
		}
	});
})(window, window.L);
