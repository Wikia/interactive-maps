/**
 * modil.js requires each module to have id passed to define as first parameter while creating AMD module.
 * Unfortunately leaflet doesn't follow this pattern which causes JS errors.
 * This module is a simple wrapper in order to use leaflet as a AMD module in our app together with modil.js
 */

define('im.leafletWrapper',  ['im.window'], function (w) {
	'use strict';

	return w.L;
});
