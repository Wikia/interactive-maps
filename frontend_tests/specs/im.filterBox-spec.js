'use strict';

describe('im.filterBox', function () {
	var tracker = jasmine.createSpyObj('tracker', ['track']),
		documentMock = jasmine.createSpyObj(
			'documentMock', ['getElementById', 'getElementsByClassName', 'createElement', 'appendChild']
		),
		w = {
			document: documentMock
		},
		config = {
			pointTypeFiltersContainerId: 'test'
		},
		utils = jasmine.createSpyObj('utils', ['toggleClass']),
		i18n = jasmine.createSpyObj('i18n', ['msg']),
		mapModule = {},
		renderUI = jasmine.createSpyObj('renderUI', ['buildPointTypeFilterHtml', 'createPointTypeFiltersContainer']),
		poiCollectionModule = jasmine.createSpyObj('poiCollectionModule', ['getPoiByCategory']),
		poiCategoryModule = {},
		filterMock = jasmine.createSpyObj('filterMock', ['getAttribute']),

		filterBox = modules['im.filterBox'](
			tracker, w, config, utils, i18n, mapModule, renderUI, poiCollectionModule, poiCategoryModule
		);

	it('toggles visibility of filter box', function () {
		var element = '';

		filterBox.toggleFilterBox(element);

		expect(utils.toggleClass).toHaveBeenCalledWith(element, 'shown-box');
		expect(utils.toggleClass).toHaveBeenCalledWith(element, 'hidden-box');
	});

	it('toggles visibility of points of given category', function () {
		var pointTypeId = '10',
			parsedPointTypeId = parseInt(pointTypeId, 10),
			dataAttrName = 'data-point-type',
			pointsMock = [1, 2, 3, 4];

		poiCollectionModule.getPoiByCategory.andReturn(pointsMock);
		filterMock.getAttribute.andReturn(pointTypeId);
		filterBox.togglePoints(filterMock);

		expect(filterMock.getAttribute).toHaveBeenCalledWith(dataAttrName);
		expect(poiCollectionModule.getPoiByCategory).toHaveBeenCalledWith(parsedPointTypeId);

		pointsMock.forEach(function (point) {
			expect(utils.toggleClass).toHaveBeenCalledWith(point, 'hidden');
		});
	});

	it('toggles filter state', function () {
		var pointTypeId = '10',
			parsedPointTypeId = parseInt(pointTypeId, 10),
			dataAttrName = 'data-point-type';

		tracker.ACTIONS = {
			CLICK: 'click'
		};

		filterMock.getAttribute.andReturn(pointTypeId);
		filterBox.togglePointTypeFilter(filterMock);

		expect(filterMock.getAttribute).toHaveBeenCalledWith(dataAttrName);
		expect(tracker.track).toHaveBeenCalledWith(
			'map', tracker.ACTIONS.CLICK, 'poi-category-filter', parsedPointTypeId
		);
		expect(utils.toggleClass).toHaveBeenCalledWith(filterMock, 'enabled');
	});

	it('sets up filter box hide button', function () {
		var linkElementMock = {};

		documentMock.createElement.andReturn(linkElementMock);
		documentMock.getElementsByClassName.andReturn([documentMock]);
		filterBox.setUpHideButton();

		expect(documentMock.createElement).toHaveBeenCalledWith('a');
		expect(i18n.msg).toHaveBeenCalledWith('wikia-interactive-maps-hide-filter');
		expect(documentMock.getElementsByClassName).toHaveBeenCalledWith('filter-menu-header');
		expect(documentMock.appendChild).toHaveBeenCalledWith(linkElementMock);
	});

	it('sets up filter box', function () {
		var domElMock = jasmine.createSpyObj('domElMock', ['addEventListener']),
			poiCategories = [1, 2, 3],
			isExpended = true,
			categoryFilterHtmlMock = '<li></li>',
			categoryFiltersHtmlMock = '<li></li><li></li><li></li>',
			filterBoxHtmlMock = '<div></div>';

		renderUI.buildPointTypeFilterHtml.andReturn(categoryFilterHtmlMock);
		renderUI.createPointTypeFiltersContainer.andReturn(filterBoxHtmlMock);
		documentMock.getElementById.andReturn(domElMock);
		documentMock.getElementsByClassName.andReturn([domElMock]);

		filterBox.setupFilterBox(documentMock, poiCategories, isExpended);

		poiCategories.forEach(function (category) {
			expect(renderUI.buildPointTypeFilterHtml).toHaveBeenCalledWith(category);
		});
		expect(renderUI.createPointTypeFiltersContainer).toHaveBeenCalledWith(categoryFiltersHtmlMock, isExpended);
		expect(documentMock.appendChild).toHaveBeenCalledWith(filterBoxHtmlMock);
		expect(documentMock.getElementById).toHaveBeenCalledWith(config.pointTypeFiltersContainerId);
		expect(documentMock.getElementsByClassName).toHaveBeenCalledWith('filter-menu-header');
		expect(domElMock.addEventListener).toHaveBeenCalled();
		expect(domElMock.addEventListener.calls.length).toEqual(2);
	});
});
