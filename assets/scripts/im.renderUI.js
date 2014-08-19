'use strict';

define('im.renderUI', ['im.config'], function (config) {
	/**
	 * @desc Build link HTML
	 * @param {object} point - POI object
	 * @param {string} innerHtml - string of HTML markup
	 * @param {string=} className - class name
	 * @returns {string} - HTMl markup for link
	 */
	function buildLinkHTML(point, innerHtml, className) {
		var classString = (className) ? ' class="' + className + '"' : '';

		return '<a href="' + point.link + '" title="' + point.name + '"' + classString + ' target="_blank">' +
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
		return '<img src="' + imageUrl + '" alt="' + alt + '" width="' + imageWidth + '" height="'+ imageHeight + '">';
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

	return {
		buildPopupHtml: buildPopupHtml,
		buildPointTypeFilterHtml: buildPointTypeFilterHtml
	};
});
