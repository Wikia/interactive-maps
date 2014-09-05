'use strict';

describe('im.poi', function () {
	var markers = jasmine.createSpyObj('markers', ['getLayer']),
		markerSpy = jasmine.createSpyObj('marker', ['addTo', 'bindPopup']),
		popupSpy = jasmine.createSpyObj('popup', ['setContent']),
		L = {
			marker: function () {
				// mock adding leaflet marker id
				markerSpy._leaflet_id = 1;
				return markerSpy;
			},
			popup: function () {
				return popupSpy;
			}
		},
		config = {
			popupWidthWithPhoto: 1,
			popupWidthWithoutPhoto: 2
		},
		renderUI = {
			buildPopupHtml: function () {}
		},
		i18n = {
			msg: function () {}
		},
		imPoi = modules['im.poi'](L, config, renderUI, i18n),
		poi = {
			photo: 'test-photo.jpg'
		},
		marker = imPoi.addPoiToMap(poi, 'test-icon.jpg', markers);

	it('adds new marker to the markers leaflet layer group', function () {
		expect(markerSpy.addTo).toHaveBeenCalled();
		expect(markerSpy.addTo).toHaveBeenCalledWith(markers);
	});

	it('creates new marker and returns it', function () {
		expect(marker).toBe(markerSpy);
	});

	it('binds popup to marker', function () {
		expect(markerSpy.bindPopup).toHaveBeenCalled();
	});

	it('creates popup', function () {
		expect(markerSpy.bindPopup).toHaveBeenCalledWith(popupSpy);
	});

	it('sets popup content', function () {
		expect(popupSpy.setContent).toHaveBeenCalled();
	});

	it('extends poi object with markers leaflet id', function () {
		expect(poi.leafletId).toBe(markerSpy._leaflet_id);
	});

	it('extends marker object with poi data', function () {
		expect(marker.point).toBe(poi);
	});

	it('it uses leaflet getLayer to retrieve marker from markers layer group', function () {
		var id = '1';

		imPoi.getPoiMarker(markers, id);

		expect(markers.getLayer).toHaveBeenCalled();
		expect(markers.getLayer).toHaveBeenCalledWith(id);
	});

	it('it creates temporary marker', function () {
		var eventMock = {
			layer: markerSpy
			},
			tempMarker;

		markerSpy.getLatLng = function () {
			return {
				lat: 1,
				lng: 1
			};
		};

		tempMarker = imPoi.createTempPoiMarker(eventMock);

		expect(tempMarker).toBe(markerSpy);
		expect(tempMarker.point.lat).toBeDefined();
		expect(tempMarker.point.lon).toBeDefined();
		expect(tempMarker.point.lat).toBe(1);
		expect(tempMarker.point.lon).toBe(1);
	});
});
