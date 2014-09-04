'use strict';

define('im.config', ['im.window'], function (w) {
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
		uiControlsPosition: 'bottomright'
	};
});
