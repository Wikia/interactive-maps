'use strict';

define('im.config', ['im.window'], function(w) {
	return {
		mapConfig: w.mapSetup,
		messages: w.mapSetup.i18n,
		pontoTimeout: 500,
		popupWidthWithPhoto: 414,
		popupWidthWithoutPhoto: 314,
		mobileMaxWidth: 430,
		mobilePopupWidth: 310,
		autoZoomPadding: 0.01,
		poiIconWidth: 30,
		poiIconHeight: 30,
		photoWidth: 90,
		photoHeight: 90,
		mapContainerId: 'map',
		pointTypeFiltersContainerId: 'pointTypes',
		editPointTypesButtonId: 'editPointTypes',
		allPointTypesFilterId: 'allPointTypes',
		pontoBridgeModule: 'wikia.intMap.pontoBridge',
		uiControlsPosition: 'bottomright',
		pontoCommunicationAPI: {
			responseMessages: {
				setPlayerLocation: 'Player location set successfully',
				removePlayerLocation: 'Player location removed from map successfully',
				invalidParamTypes: '"lat" and "lng" params must be numbers',
				outOfMapBounds: 'Player location must be inside map boundaries'
			},
			responseCodes: {
				success: 200,
				invalidParams: 422
			},
			defaultMarkerSize: 70,
			defaultPlayerIcon: '/assets/images/player_location_marker.png'
		}
	};
});
