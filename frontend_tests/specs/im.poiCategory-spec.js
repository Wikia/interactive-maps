'use strict';

describe('im.poiCategory', function () {
	var L = jasmine.createSpyObj('L', ['icon', 'setOptions']),
		config = {
			mapConfig: {
				catchAllCategoryId: 0,
				types: [
					{
						id: 0,
						marker: null
					},
					{
						id: 1,
						marker: 'test-marker.jpg',
						no_marker: true
					},
					{
						id: 2,
						marker: 'test-marker.jpg'
					},
				]
			},
			poiIconWidth: 1,
			poiIconHeight: 1
		},
		poiCategory,
		intialCategories = config.mapConfig.types;

	// Extend leaflet mock
	L.Icon = {
		Default: function () {
			return {
				_getIconUrl: function () {
					return 'test.png';
				}
			};
		}
	};

	poiCategory = modules['im.poiCategory'](L, config);

	/**
	 * @desc helper function for testing poi categories
	 * @returns {Object}
	 */
	function setupCategoriesHelper() {
		// setup categories
		poiCategory.setupPoiCategories(intialCategories);

		return {
			editableCategories: poiCategory.getEditablePoiCategories(),
			unEditableCategories: poiCategory.getUnEditablePoiCategories(),
			allCategories: poiCategory.getAllPoiCategories()
		};
	}

	/**
	 * @desc helper function for testig poi category icons
	 */
	function setupPoiCategoryIconHelper() {
		intialCategories.forEach(function (category) {
			poiCategory.setupPoiCategoryIcon(category);
		});
	}

	it('setup editable and uneditable poi categories', function () {
		var categories = setupCategoriesHelper();

		expect(categories.editableCategories.length).toBe(2);
		expect(categories.editableCategories[0].id).toBe(1);
		expect(categories.editableCategories[1].id).toBe(2);
		expect(categories.unEditableCategories.length).toBe(1);
		expect(categories.unEditableCategories[0].id).toBe(0);
	});

	it('returns both editable and uneditable poi categories', function () {
		var categories = setupCategoriesHelper();

		expect(categories.allCategories.length).toBe(3);
		expect(categories.allCategories[0].id).toBe(1);
		expect(categories.allCategories[1].id).toBe(2);
		expect(categories.allCategories[2].id).toBe(0);
	});

	it('sets uneditable "Other" category as last element of all categories array', function () {
		var categories = setupCategoriesHelper();

		expect(categories.allCategories.pop().id).toBe(0);
	});

	it('sets poi category custom icon', function () {
		var iconParamMock = {
			iconUrl: intialCategories[2].marker,
			iconSize: [config.poiIconWidth, config.poiIconHeight]
		};

		setupPoiCategoryIconHelper();

		expect(L.icon.callCount).toBe(1);
		expect(L.icon).toHaveBeenCalledWith(iconParamMock);
	});

//	it('sets poi category default icon', function () {
//		setupPoiCategoryIconHelper();
//
//		expect(L.Icon.Default).toHaveBeenCalled();
//		expect(L.Icon.Default.callCount).toBe(2);
//	});

	it('extends poi category object with className data', function () {
		var category = intialCategories[2],
			paramsMock = {
				className: 'point-type-' + category.id
			};

		poiCategory.setupPoiCategoryIcon(category);

		expect(L.setOptions).toHaveBeenCalled();
		expect(L.setOptions).toHaveBeenCalledWith(undefined, paramsMock);
	});

//	it('stores poi category icon in icon cache object', function () {
//		var category = intialCategories[2];
//
//		poiCategory.setupPoiCategoryIcon(category);
//	});
});
