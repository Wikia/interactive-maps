define(
	'im.filterBox',
	[
		'tracker',
		'im.window',
		'im.config',
		'im.utils',
		'im.i18n',
		'im.map',
		'im.renderUI',
		'im.poiCollection',
		'im.poiCategory'
	],
	function (tracker, w, config, utils, i18n, mapModule, renderUI, poiCollectionModule, poiCategoryModule) {
		'use strict';

		var doc = w.document,
			filtersContainer;

		/**
		 * @desc Expands / folds the filter box
		 * @param {HTMLElement} filterBox
		 */
		function toggleFilterBox(filterBox) {
			utils.toggleClass(filterBox, 'shown-box');
			utils.toggleClass(filterBox, 'hidden-box');
		}

		/**
		 * @desc Toggles visibility of points corresponding with clicked filter
		 * @param {Element} filterClicked - Filter element that was clicked
		 */
		function togglePoints(filterClicked) {
			var pointType = parseInt(filterClicked.getAttribute('data-point-type'), 10),
				points = poiCollectionModule.getPoiByCategory(pointType),
				pointsLength = points.length,
				i;

			for (i = 0; i < pointsLength; i++) {
				utils.toggleClass(points[i], 'hidden');
			}
		}

		/**
		 * @desc Toggles state of point type filter
		 * @param {Element} filterClicked - Filter element that was clicked
		 */
		function togglePointTypeFilter(filterClicked) {
			tracker.track(
				'map',
				tracker.ACTIONS.CLICK,
				'poi-category-filter',
				parseInt(filterClicked.getAttribute('data-point-type'), 10)
			);

			utils.toggleClass(filterClicked, 'enabled');
		}

		/**
		 * @desc Toggles state of "All pin types" filter
		 */
		function toggleAllPointTypesFilter() {
			var allPointTypesFilter = doc.getElementById(config.allPointTypesFilterId),
				enabled = 'enabled',
				poiCategories = poiCategoryModule.getAllPoiCategories(),
				filtersEnabledLength = filtersContainer.getElementsByClassName('point-type enabled').length;

			if (poiCategories.length === filtersEnabledLength && !utils.hasClass(allPointTypesFilter, enabled)) {
				utils.addClass(allPointTypesFilter, enabled);
			} else {
				utils.removeClass(allPointTypesFilter, enabled);
			}

		}

		/**
		 * @desc Handles click on "All pin types" filter
		 */
		function allPointTypesFilterClickHandler() {
			var allPointTypesFilter = doc.getElementById(config.allPointTypesFilterId),
				filters = filtersContainer.getElementsByClassName('point-type'),
				filtersLength = filters.length,
				points = poiCollectionModule.getPoiByCategory(0),
				pointsLength = points.length,
				disabled = !utils.hasClass(allPointTypesFilter, 'enabled'),
				i;

			// enable/disable all filters
			for (i = 0; i < filtersLength; i++) {
				if (disabled) {
					utils.addClass(filters[i], 'enabled');
				} else {
					utils.removeClass(filters[i], 'enabled');
				}
			}

			// show/hide all points
			for (i = 0; i < pointsLength; i++) {
				if (disabled) {
					utils.removeClass(points[i], 'hidden');
				} else {
					utils.addClass(points[i], 'hidden');
				}
			}

			toggleAllPointTypesFilter();

			tracker.track('map', tracker.ACTIONS.CLICK, 'poi-category-filter', 0);
		}

		/**
		 * @desc Handles click on point type filter
		 * @param {Element} filterClicked - Filter element that was clicked
		 */
		function pointTypeFilterClickHandler(filterClicked) {
			togglePointTypeFilter(filterClicked);
			toggleAllPointTypesFilter();
			togglePoints(filterClicked);
		}

		/**
		 * @desc Handles click on point type filters container
		 * @param {Event} event - Click event
		 */
		function pointTypeFiltersContainerClickHandler(event) {
			var elementClicked = event.target,
				filterClicked = elementClicked,
				pointType;

			if (elementClicked.parentNode.tagName === 'LI') {
				filterClicked = elementClicked.parentNode;
			}

			mapModule.getMapObject().closePopup();

			pointType = parseInt(filterClicked.getAttribute('data-point-type'), 10);

			if (pointType === 0) {
				allPointTypesFilterClickHandler();
			} else {
				pointTypeFilterClickHandler(filterClicked);
			}
		}

		/**
		 * @desc Handles click event on the filterBox header
		 * @param {Event} event
		 */
		function handleBoxHeaderClick(event) {
			if (event.target.id !== config.editPointTypesButtonId) {
				var filterBox = event.currentTarget.parentElement;
				toggleFilterBox(filterBox);
			}
		}

		/**
		 * @desc adds hide button when on wikia mobile or embed code
		 */
		function setUpHideButton() {
			var hide = doc.createElement('a');
			hide.innerHTML = i18n.msg('wikia-interactive-maps-hide-filter');
			hide.className = 'hide-button';
			doc.getElementsByClassName('filter-menu-header')[0].appendChild(hide);
		}

		/**
		 * @desc
		 * @param mapWrapper
		 * @param poiCategories
		 * @param isExpanded
		 */
		function setupFilterBox(mapWrapper, poiCategories, isExpanded) {
			var poiCategoriesHTML = '';

			// create filters HTML
			poiCategories.forEach(function (category) {
				poiCategoriesHTML += renderUI.buildPointTypeFilterHtml(category);
			});

			//create filter box
			mapWrapper.appendChild(
				renderUI.createPointTypeFiltersContainer(poiCategoriesHTML, isExpanded)
			);

			// set reference to filters container
			filtersContainer = doc.getElementById(config.pointTypeFiltersContainerId);

			// attach filter box event handlers
			filtersContainer.addEventListener('click', pointTypeFiltersContainerClickHandler, false);
			doc.getElementsByClassName('filter-menu-header')[0].addEventListener('click', handleBoxHeaderClick);
		}

		function getFiltersContainer() {
			return filtersContainer;
		}

		return {
			togglePoints: togglePoints,
			togglePointTypeFilter: togglePointTypeFilter,
			setupFilterBox: setupFilterBox,
			getFiltersContainer: getFiltersContainer,
			setUpHideButton: setUpHideButton,
			toggleFilterBox: toggleFilterBox
		};
	}
);
