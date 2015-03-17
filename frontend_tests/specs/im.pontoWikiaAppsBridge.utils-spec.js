'use strict';

describe('im.pontoWikiaAppsBridge.utils', function () {
	var config = {
			articleLinkClassName: 'poi-article-link'
		},
		utils = modules['im.pontoWikiaAppsBridge.utils'](config);

	it('return link element for simple link', function () {
		var target = {
			tagName: 'A',
			className: 'poi-article-link test1 test2 blablabla'
		};

		expect(utils.getArticleLinkEl(target)).toBe(target);
	});

	it('return link element for thumbnail link', function () {
		var target = {
			tagName: 'IMG',
			parentNode: {
				tagName: 'A',
				className: 'poi-article-link test1 test2 blablabla'
			}
		};

		expect(utils.getArticleLinkEl(target)).toBe(target.parentNode);
	});

	it('return null for invalid link', function () {
		var cases = [
			{
				tagName: 'IMG',
				parentNode: {
					tagName: 'A',
					className: 'test1 test2 blablabla'
				}
			},
			{
				tagName: 'A',
				className: 'test1 test2 blablabla'
			},
			{
				tagName: 'H1',
				className: 'poi-article-link test1 test2 blablabla'
			}
		];

		cases.forEach(function (target) {
			expect(utils.getArticleLinkEl(target)).toBeNull();
		});
	});
});
