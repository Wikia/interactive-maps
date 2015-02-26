define('im.renderUI', ['im.config', 'im.window', 'im.i18n'], function (config, w, i18n) {
	'use strict';

	var doc = w.document;

	/**
	 * @desc Build link HTML
	 * @param {object} point - POI object
	 * @param {string} innerHtml - string of HTML markup
	 * @param {string=} className - class name
	 * @returns {string} - HTMl markup for link
	 */
	function buildLinkHTML(point, innerHtml, className) {
		var classString = (className) ? ' class="' + className + '"' : '';

		return '<a href="' + point.link + '" title="' + point.name + '" data-article-title="' + point.link_title + '"' + classString + ' target="_blank">' +
			innerHtml + '</a>';
	}

	/**
	 * @desc Build image HTML
	 * @param {string} imageUrl - Image URL
	 * @param {string} alt - Image alternate text
	 * @param {number} imageWidth
	 * @param {number} imageHeight
	 * @returns {string} - HTML markup for photo
	 */
	function buildImageHTML(imageUrl, alt, imageWidth, imageHeight) {
		return '<img src="' + imageUrl + '" alt="' + alt + '" width="' + imageWidth + '" height="' + imageHeight + '">';
	}

	/**
	 * @desc Builds filter html
	 * @param {string} imageUrl
	 * @param {string} alt
	 * @returns {string} HTML markup for filter box icon
	 */
	function buildFilter(imageUrl, alt) {
		return '<div class="point-type-icon"><img src="' + imageUrl + '" alt="' + alt + '"></div>';
	}

	/**
	 * @desc Build popup HTML
	 * @param {object} point - POI object
	 * @param {string} editLinkMsg - text for edit link
	 * @returns {string} - HTML markup for popup
	 */
	function buildPopupHtml(point, editLinkMsg) {
		var photoHtml = '',
			titleHtml = '<h3>' + (point.link ? buildLinkHTML(point, point.name, 'poi-article-link') : point.name) +
				'</h3>',
			descriptionHtml = (point.description ? '<p>' + point.description + '</p>' : ''),
			editLink = '<a title="' + editLinkMsg + '" class="edit-poi-link" data-marker-id="' + point.leafletId + '">' +
				editLinkMsg + '</a>';

		if (point.photo && point.link) {
			photoHtml = buildLinkHTML(
				point,
				buildImageHTML(point.photo, point.name, config.photoWidth, config.photoHeight),
				'photo'
			);
		} else if (point.photo) {
			photoHtml = buildImageHTML(point.photo, point.name, config.photoWidth, config.photoHeight);
		}

		return photoHtml + '<div class="description">' + titleHtml + editLink + descriptionHtml + '</div>';
	}

	/**
	 * @desc Build point type filter HTML
	 * @param {object} pointType - POI type object
	 * @returns {string} - HTML markup for point type filter
	 */
	function buildPointTypeFilterHtml(pointType) {
		return '<li class="point-type enabled" data-point-type="' + pointType.id + '">' +
			buildFilter(pointType.marker, pointType.name) +
			'<span>' + pointType.name + '</span></li>';
	}

	/**
	 * Create Point types filter container
	 * @param {String} poiCategoriesHTML
	 * @param {Boolean=} isExpanded - optional param for initial state of filter box if true it wil be expanded
	 * @returns {Element}
	 */
	function createPointTypeFiltersContainer(poiCategoriesHTML, isExpanded) {
		var div = doc.createElement('div'),
			header = doc.createElement('div'),
			headerTitle = doc.createElement('span'),
			headerEdit = doc.createElement('span'),
			ul = doc.createElement('ul'),
			li = doc.createElement('li');

		div.setAttribute('id', 'filterMenu');
		div.setAttribute('class', 'filter-menu ' + (isExpanded ? 'shown' : 'hidden') + '-box');

		header.setAttribute('class', 'filter-menu-header');

		headerTitle.appendChild(doc.createTextNode(i18n.msg('wikia-interactive-maps-filters')));
		header.appendChild(headerTitle);

		headerEdit.setAttribute('id', config.editPointTypesButtonId);
		headerEdit.setAttribute('class', 'edit-point-types');
		headerEdit.appendChild(doc.createTextNode(i18n.msg('wikia-interactive-maps-edit-pin-types')));
		header.appendChild(headerEdit);

		div.appendChild(header);

		ul.setAttribute('id', config.pointTypeFiltersContainerId);
		ul.setAttribute('class', 'point-types');

		li.setAttribute('id', 'allPointTypes');
		li.setAttribute('class', 'enabled');
		li.setAttribute('data-point-type', '0');
		li.appendChild(doc.createTextNode(i18n.msg('wikia-interactive-maps-all-pin-types')));
		ul.appendChild(li);
		ul.innerHTML += poiCategoriesHTML;
		div.appendChild(ul);

		return div;
	}

	return {
		buildPopupHtml: buildPopupHtml,
		buildPointTypeFilterHtml: buildPointTypeFilterHtml,
		createPointTypeFiltersContainer: createPointTypeFiltersContainer
	};
});
