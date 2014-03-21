utils = require('../lib/utils');

describe('utils', function (){
	it('calculates max zoom level correctly', function () {
		var testSet = [
				{
					zoom: 0,
					width: 256,
					height: 256
				},
				{
					zoom: 1,
					width: 512,
					height: 512
				},
				{
					zoom: 2,
					width: 1024,
					height: 1024
				},
				{
					zoom: 3,
					width: 2048,
					height: 2048
				},
				{
					zoom: 4,
					width: 4096,
					height: 4096
				},
				{
					zoom: 5,
					width: 8192,
					height: 8192
				},
				{
					zoom: 5,
					width: 16384,
					height: 16384
				},
				{
					zoom: 1,
					width: 700,
					height: 700
				}
			],
			maxZoom = 5;
		testSet.forEach(function(testCase){
			expect(utils.getMaxZoomLevel(testCase.width, testCase.height, maxZoom)).toBe(testCase.zoom);
		});
	})
});