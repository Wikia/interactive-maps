'use strict';

var utils = require('../lib/utils');

describe('utils', function () {
	it('calculates max zoom level correctly', function () {
		var testSet = [{
			zoom: 0,
			width: 256,
			height: 256
		}, {
			zoom: 1,
			width: 512,
			height: 512
		}, {
			zoom: 2,
			width: 1024,
			height: 1024
		}, {
			zoom: 3,
			width: 2048,
			height: 2048
		}, {
			zoom: 4,
			width: 4096,
			height: 4096
		}, {
			zoom: 5,
			width: 8192,
			height: 8192
		}, {
			zoom: 5,
			width: 16384,
			height: 16384
		}, {
			zoom: 1,
			width: 700,
			height: 700
		}],
			maxZoom = 5;
		testSet.forEach(function (testCase) {
			expect(utils.getMaxZoomLevel(testCase.width, testCase.height, maxZoom)).toBe(testCase.zoom);
		});
	});

	it('generates correct glob', function(){
		var testSet = [{
			base: 'base',
			min: 0,
			max: 0,
			postfix: '',
			expect: 'base/0'
		},{
			base: 'base/base',
			min: 0,
			max: 3,
			postfix: '',
			expect: 'base/base/{0..3}'
		},{
			base: 'base',
			min: 3,
			max: 3,
			postfix: '',
			expect: 'base/3'
		},{
			base: 'base',
			min: 0,
			max: 0,
			postfix: '/0/0.png',
			expect: 'base/0/0/0.png'
		},{
			base: 'base',
			min: 0,
			max: 3,
			postfix: '/0/1.png',
			expect: 'base/{0..3}/0/1.png'
		},{
			base: 'base',
			min: 4,
			max: 4,
			postfix: '/test',
			expect: 'base/4/test'
		}];

		testSet.forEach(function (testCase) {
			expect(utils.getGlob(testCase.base, testCase.min, testCase.max, testCase.postfix)).toBe(testCase.expect);
		});
	});

	it('converts bin to max zoom level', function () {
		var testSet = [{
			zoomLevel: 0,
			expect: 0
		},{
			zoomLevel: 1,
			expect: 1
		},{
			zoomLevel: 2,
			expect: 2
		},{
			zoomLevel: 3,
			expect: 4
		},{
			zoomLevel: 4,
			expect: 8
		},{
			zoomLevel: 5,
			expect: 16
		},{
			zoomLevel: 6,
			expect: 32
		},{
			zoomLevel: 7,
			expect: 64
		},{
			zoomLevel: 8,
			expect: 128
		},{
			zoomLevel: 9,
			expect: 256
		},{
			zoomLevel: 11,
			expect: 1024
		},{
			zoomLevel: 16,
			expect: 32768
		}];

		testSet.forEach(function (testCase) {
			expect(utils.zoomLevelsToBin(testCase.zoomLevel)).toBe(testCase.expect);
		});
	});

	it('converts zoom level to binary representation', function () {
		var testSet = [{
			bin: 0,//0
			expect: 0
		},{
			bin: 1, //1
			expect: 1
		},{
			bin: 2, //10
			expect: 0
		},{
			bin: 3, //11
			expect: 2
		},{
			bin: 4, //1000
			expect: 0
		},{
			bin: 7, //111
			expect: 3
		},{
			bin: 12,//1100
			expect: 0
		},{
			bin: 15, //1111
			expect: 4
		},{
			bin: 79, //01001111
			expect: 4
		},{
			bin: 95, //01011111
			expect: 5
		},{
			bin: 127, //01111111
			expect: 7
		},{
			expect: 0
		},{
			bin: '01111111',
			expect: 7
		},{
			bin: '01001111',
			expect: 4
		},{
			bin: '0110000000001',
			expect: 1
		},{
			bin: '01100110011',
			expect: 2
		}];

		testSet.forEach(function (testCase) {
			expect(utils.binToMaxZoomLevel(testCase.bin)).toBe(testCase.expect);
		});
	});
});
