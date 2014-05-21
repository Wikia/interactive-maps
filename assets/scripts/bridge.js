(function (window) {
	var bridge = function () {
		'use strict';
		
		// Window object to send the messages to
		var target,
			// desc URL origin of the target
			 getOrigin = '',
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
			function attach (_target) {
				target = _target;
				targetOrigin = _targetOrigin;
				localOrigin = window.location.origin;
				window.addEventListener('message', onMessage, false);
				ready = true;
			}
			if (iframeEl) {
				attach(iframeEl.contentWindow);
			} else {
				if (window.top !== window) {
					attach(window.top);
				} else {
					throw 'Bridge: No iFrame to communicate with';
				}
			}
		}

		/**
		 * @desc Listener for Window messages
		 *
		 * @param {Event} event - Window message event
		 */
		function onMessage (event) {
			var data = event.data,
				context;
			if (data) {
				try{
					context = JSON.parse(event.data);
				} catch (e) {
					context = {};
				}
			}
			if (typeof context.event === 'string') {
				emit(context.event, context.data, context.callbackId ? context.callbackId : null );
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
		function emit (event, data, callbackId) {
			var eventKey = callbackId ? event : event + '.' + callbackId;
			if (callbacks[eventKey]) {
				callbacks[eventKey].forEach(function (callback) {
					callback.call(window, data, callbackId);
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
		function send (event, data, callback) {
			if (typeof event === 'string' && (typeof data === 'object' || !data)) {
				var callbackId = Math.random().toString().substr(2);
				target.postMessage(JSON.stringify({
					event: event,
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
			send(event + '.' + callbackId, data);
		}

		return {
			init: init,
			on: on,
			send: send,
			respond: respond
		};

	};

	if (typeof window.define === 'function' && window.define.amd) {
		window.define('Bridge', bridge);
	} else {
		window.Bridge = bridge();
	}

})(window);
