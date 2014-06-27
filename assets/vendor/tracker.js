/**
 * GA Tracker implementation
 */
(function (context) {

	/**
	 * AMD support
	 *
	 * @private
	 *
	 * @type {Boolean}
	 */
	var amd = false;

	function tracker() {
		/** @private **/

		/**
		 * DO NOT ADD TO THIS LIST WITHOUT CONSULTATION FROM TRACKING TEAM LEADS
		 * Keep it in alphabetical order
		 */
		var actions = {
			// Generic add
			ADD: 'add',

			// Generic click, mostly javascript clicks
			// NOTE: When tracking clicks, consider binding to 'onMouseDown' instead of 'onClick'
			// to allow the browser time to send these events naturally. For more information on
			// this issue, see the `track()` method in "resources/modules/tracker.js"
			CLICK: 'click',

			// Click on navigational button
			CLICK_LINK_BUTTON: 'click-link-button',

			// Click on image link
			CLICK_LINK_IMAGE: 'click-link-image',

			// Click on text link
			CLICK_LINK_TEXT: 'click-link-text',

			// Generic close
			CLOSE: 'close',

			// Clicking okay in a confirmation modal
			CONFIRM: 'confirm',

			// Generic disable
			DISABLE: 'disable',

			// Generic enable
			ENABLE: 'enable',

			// Generic error (generally AJAX)
			ERROR: 'error',

			// Generic hover
			HOVER: 'hover',

			// impression of item on page/module
			IMPRESSION: 'impression',

			// Generic keypress
			KEYPRESS: 'keypress',

			// Video play
			PLAY_VIDEO: 'play-video',

			// Removal
			REMOVE: 'remove',

			// Generic open
			OPEN: 'open',

			// Generic paginate
			PAGINATE: 'paginate',

			// Sharing view email, social network, etc
			SHARE: 'share',

			// Form submit, usually a post method
			SUBMIT: 'submit',

			// Successful ajax response
			SUCCESS: 'success',

			// General swipe event
			SWIPE: 'swipe',

			// Action to take a survey
			TAKE_SURVEY: 'take-survey',

			// View
			VIEW: 'view'
		};

		/**
		 * Sends event to Google Analytics
		 *
		 * @param {string} category required GA category
		 * @param {string} action required GA category
		 * @param {string} label optional GA label
		 * @param {integer} value optional GA value
		 */
		function track(category, action, label, value) {
			context.ga('send', 'event', category, action, label, value);
		}

		/** @public **/
		return {
			ACTIONS: actions,
			track: track
		};
	}

	// check for AMD availability
	if (typeof define !== 'undefined' && define.amd) {
		amd = true;
	}

	// make module available in the global scope
	context.Tracker = tracker();

	// if AMD available then register also as a module
	// to allow easy usage in other AMD modules
	if (amd) {
		amd = true;
		define('tracker', context.Tracker);
	}

}(this));
