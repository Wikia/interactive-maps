'use strict';

describe('im.map', function () {
	var w = {},
		config = {
			mapConfig: {
				boundaries: {}
			},
			autoZoomPadding:  true
		},
		utils = {},
		boundsMock = {
			pad: function () {}
		},
		featureGroupMock = {
			getBounds: function () {
				return boundsMock;
			}
		},
		L = {
			featureGroup: function () {
				return featureGroupMock;
			}
		},
		i18n = {},
		mapModule = modules['im.map'](w, config, utils, L, i18n);

//	it('set app POIs in view', function () {
//		var pois = [];
//
//		spyOn(L, 'featureGroup').andCallThrough();
//		spyOn(featureGroupMock, 'getBounds').andCallThrough();
//		spyOn(boundsMock, 'pad');
//
//		mapModule.setAllPoisInView(pois);
//
//		expect(L.featureGroup).toHaveBeenCalledWith(pois);
//
//
//	});

	it('returns map boundaries', function () {
		expect(mapModule.getMapBoundaries()).toBe(config.mapConfig.boundaries);
	});
});
