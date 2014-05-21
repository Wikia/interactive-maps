(function (window) {
	var bridge = function () {
		'use strict';
		
		// Window object to send the messages to
		var target,
			// desc URL origin of the target
			targetOrigin = '',
			// Local URL origin
			localOrigin = '',
			// Registry for callbacks
			callbacks = {};

		/**
		 * @desc Finds appropriate communication channel
		 * and starts listening for events
		 * @param {String} _targetOrigin - URL origin for the second side
		 * @param {HTMLElement | undefined} iframeEl
		 * call it without arguments to init channel inside iframe
		 */
		function init (_targetOrigin, iframeEl) {
			target = (iframeEl ? iframeEl.contentWindow :
				window.top !== window ? window.top : null);

			if ( !target ) {
				throw new Error('Bridge: No iframe to communicate with');
			}

			targetOrigin = _targetOrigin;
			localOrigin = window.location.origin;
			window.addEventListener('message', onMessage, false);
		}

		/**
		 * @desc Listener for Window messages
		 * @param {Event} event - Window message event
		 */
		function onMessage (event) {
			var hash;
			try {
				hash = JSON.parse(event.data);
			} catch (e) {
				hash = {};
			}
			if (typeof hash.event === 'string') {
				emit(hash.event, hash.type, hash.data, hash.callbackId);
			}
		}

		/**
		 * @desc Communication event subscriber
		 * @param {String} event - communication event name
		 * @param {Function} callback - event handler
		 */
		function on (event, callback) {
			if(!callbacks[event]) {
				callbacks[event] = [];
			}
			callbacks[event].push(callback);
		}

		/**
		 * @desc Calls every method subscribed for an event
		 * @param {String} event - communication event name
		 * @param {Object} data - data sent with an event
		 * @param {Number | null} callbackId - unique id of the callback
		 */
		function emit (event, type, data, callbackId) {
			var eventKey = event;
				if (callbacks[eventKey]) {
				callbacks[eventKey].forEach(function (callback) {
					callback(data, callbackId);
				});
			}
		}

		/**
		 * @desc Triggers event on the other side of the bridge
		 * @param {String} event - name of the event to trigger
		 * @param {Object} data - user-provided data for event
		 * @param {Function | undefined} callback to call after the response
		 * to the event
		 */
		function send (event, type, data, callback) {
			if (typeof event === 'string' && (typeof data === 'object' || !data)) {
				var callbackId = Math.random().toString().substr(2);
				target.postMessage(JSON.stringify({
					event: event,
					type: type,
					data: data,
					callbackId: callbackId
				}), targetOrigin);
				callbacks[event + '.' + callbackId] = [callback];
			}
		}

		/**
		 * @desc Respond to an event (send data back to the other side of the bridge)
		 * @param {String} event - event name to respond to
		 * @param {Object} data - user-provided data attached to response
		 * @param {Number} callbackId - id of the handler to trigger on the other side
		 */
		function respond (event, data, callbackId) {
			send(event + '.' + callbackId, 'response', data);
		}

		/**
		 * @desc Request an event (on the other side of the bridge)
		 * @param {String} event - event name
		 * @param {Object} data - user-provided data attached to request
		 * @param {Number} callbackId - id of the handler to trigger on the other side
		 */
		function request (event, data, callback) {
			send(event, 'request', data, callback);
		}

		return {
			init: init,
			on: on,
			respond: respond,
			request: request
		};

	};

	if (typeof window.define === 'function' && window.define.amd) {
		window.define('Bridge', bridge);
	} else {
		window.Bridge = bridge();
	}

})(window);
