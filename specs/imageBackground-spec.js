'use strict';

var imageBackground = require('../lib/imageBackground'),
	pixels;

describe('imageBackground', function () {
	beforeEach(function () {
		pixels = jasmine.createSpyObj('pixels', ['get']);
		pixels.get.andReturn(123);
	});

	it('it calls get() method 4 times with right parameters', function () {
		imageBackground.getColorObject(1, 2, pixels);
		expect(pixels.get).toHaveBeenCalled();
		expect(pixels.get).toHaveBeenCalledWith(2, 1, 0);
		expect(pixels.get).toHaveBeenCalledWith(2, 1, 1);
		expect(pixels.get).toHaveBeenCalledWith(2, 1, 2);
		expect(pixels.get).toHaveBeenCalledWith(2, 1, 3);
		expect(pixels.get.calls.length).toEqual(4);
	});

	it('returns correct color channels object', function () {
		expect(imageBackground.getColorObject(1, 1, pixels)).toEqual({
			red: 123,
			green: 123,
			blue: 123,
			alpha: 123
		});
	});

});
