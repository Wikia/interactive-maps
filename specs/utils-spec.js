'use strict';

var proxyquire = require('proxyquire').noCallThru(),
	utils = proxyquire('../lib/utils', {
		'./config': {
			bucketPrefix: ''
		}
	});

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
			zoom: 2,
			width: 700,
			height: 700
		}],
			maxZoom = 5;
		testSet.forEach(function (testCase) {
			expect(utils.getMaxZoomLevel(testCase.width, testCase.height, maxZoom)).toBe(testCase.zoom);
		});
	});

	it('hrTimeToMilliseconds returns time in milliseconds', function () {
		var testSet = [{
			check: [1, 0],
			expected: 1000
		}, {
			check: [10, 0],
			expected: 10000
		}, {
			check: [0, 10000],
			expected: 1
		}];
		testSet.forEach(function (testCase) {
			expect(utils.hrTimeToMilliseconds(testCase.check)).toBe(testCase.expected);
		});
	});

	it('generates correct glob', function () {
		var testSet = [{
			base: 'base',
			min: 0,
			max: 0,
			postfix: '',
			expect: 'base/0'
		}, {
			base: 'base/base',
			min: 0,
			max: 3,
			postfix: '',
			expect: 'base/base/{0..3}'
		}, {
			base: 'base',
			min: 3,
			max: 3,
			postfix: '',
			expect: 'base/3'
		}, {
			base: 'base',
			min: 0,
			max: 0,
			postfix: '/0/0.png',
			expect: 'base/0/0/0.png'
		}, {
			base: 'base',
			min: 0,
			max: 3,
			postfix: '/0/1.png',
			expect: 'base/{0..3}/0/1.png'
		}, {
			base: 'base',
			min: 4,
			max: 4,
			postfix: '/test',
			expect: 'base/4/test'
		}, {
			base: false,
			min: 4,
			max: 4,
			postfix: '/test',
			expect: '/4/test'
		}];

		testSet.forEach(function (testCase) {
			expect(utils.getGlob(testCase.base, testCase.min, testCase.max, testCase.postfix)).toBe(testCase.expect);
		});
	});

	it('converts bin to max zoom level', function () {
		var testSet = [{
			minZoom: 0,
			maxZoom: 0,
			expect: 0
		}, {
			minZoom: 1,
			maxZoom: 1,
			expect: 1
		}, {
			minZoom: 2,
			maxZoom: 2,
			expect: 2
		}, {
			minZoom: 3,
			maxZoom: 3,
			expect: 4
		}, {
			minZoom: 4,
			maxZoom: 4,
			expect: 8
		}, {
			minZoom: 5,
			maxZoom: 5,
			expect: 16
		}, {
			minZoom: 6,
			maxZoom: 6,
			expect: 32
		}, {
			minZoom: 7,
			maxZoom: 7,
			expect: 64
		}, {
			minZoom: 8,
			maxZoom: 8,
			expect: 128
		}, {
			minZoom: 9,
			maxZoom: 9,
			expect: 256
		}, {
			minZoom: 11,
			maxZoom: 11,
			expect: 1024
		}, {
			minZoom: 0,
			maxZoom: 1,
			expect: 1
		}, {
			minZoom: 0,
			maxZoom: 2,
			expect: 3
		}, {
			minZoom: 0,
			maxZoom: 3,
			expect: 7
		}, {
			minZoom: 0,
			maxZoom: 4,
			expect: 15
		}, {
			minZoom: 2,
			maxZoom: 4,
			expect: 14
		}, {
			minZoom: 2,
			maxZoom: 5,
			expect: 30
		}, {
			minZoom: 3,
			maxZoom: 4,
			expect: 12
		}, {
			minZoom: 2,
			maxZoom: 1,
			expect: 0
		}];

		testSet.forEach(function (testCase) {
			expect(utils.zoomLevelsToBin(testCase.minZoom, testCase.maxZoom)).toBe(testCase.expect);
		});
	});

	it('converts zoom level to binary representation', function () {
		var testSet = [{
			bin: 0, //0
			expect: 0
		}, {
			bin: 1, //1
			expect: 1
		}, {
			bin: 2, //10
			expect: 0
		}, {
			bin: 3, //11
			expect: 2
		}, {
			bin: 4, //1000
			expect: 0
		}, {
			bin: 7, //111
			expect: 3
		}, {
			bin: 12, //1100
			expect: 0
		}, {
			bin: 15, //1111
			expect: 4
		}, {
			bin: 79, //01001111
			expect: 4
		}, {
			bin: 95, //01011111
			expect: 5
		}, {
			bin: 127, //01111111
			expect: 7
		}, {
			expect: 0
		}, {
			bin: '01111111',
			expect: 7
		}, {
			bin: '01001111',
			expect: 4
		}, {
			bin: '0110000000001',
			expect: 1
		}, {
			bin: '01100110011',
			expect: 2
		}];

		testSet.forEach(function (testCase) {
			expect(utils.binToMaxZoomLevel(testCase.bin)).toBe(testCase.expect);
		});
	});

	it('generates valid bucket name', function () {
		var testSet = [{
			prefix: 'prefix1_',
			id: 1,
			expect: 'prefix1_1'
		}, {
			prefix: 'prefix2_',
			id: '3',
			expect: 'prefix2_3'
		}];
		testSet.forEach(function (testCase) {
			expect(utils.getBucketName(testCase.prefix, testCase.id)).toBe(testCase.expect);
		});
	});

	it('generates correct response url', function () {
		var newReq = function (protocol, host) {
			return {
				protocol: protocol,
				headers: {
					host: host
				}
			};
		},
			testSet = [{
				req: newReq('http', 'localhost'),
				path: '/test/',
				id: 1,
				url: 'http://localhost/test/1'
			}, {
				req: newReq('https', 'lolcathost'),
				path: '/testorium/test/fest/',
				id: '3',
				url: 'https://lolcathost/testorium/test/fest/3'
			}, {
				req: newReq('http', 'lolcathost'),
				path: '/testorium/test/fest/:id',
				id: '3',
				url: 'http://lolcathost/testorium/test/fest/3'
			}];
		testSet.forEach(function (testCase) {
			expect(utils.responseUrl(testCase.req, testCase.path, testCase.id)).toBe(testCase.url);
		});
	});

	it('adds correctly trailing slashes', function () {
		var testSet = [{
				path: '/api/v1',
				expected: '/api/v1/'
			}, {
				path: '/api/v1/',
				expected: '/api/v1/'
			}];
		testSet.forEach(function (testCase) {
			expect(utils.addTrailingSlash(testCase.path)).toBe(testCase.expected);
		});
	});

	it('extends objects', function () {
		var testSet = [{
			obj1: {},
			obj2: {},
			expected: {}
		}, {
			obj1: {
				a: 1
			},
			obj2: {
				a: 2
			},
			expected: {
				a: 2
			}
		}, {
			obj1: {
				a: 1
			},
			obj2: {
				b: 2
			},
			expected: {
				a: 1,
				b: 2
			}
		}];
		testSet.forEach(function (testCase) {
			expect(JSON.stringify(utils.extendObject(testCase.obj1, testCase.obj2)))
				.toBe(JSON.stringify(testCase.expected));
		});
	});

	it('returns correct image url', function () {
		var testSet = [
			{
				dfsHost: 'example.com',
				path: 'path',
				image: 'image.png',
				expected: 'http://example.com/path/image.png'
			}
		];
		testSet.forEach(function (testCase) {
			expect(utils.imageUrl(testCase.dfsHost, testCase.path, testCase.image))
				.toBe(testCase.expected);
		});
	});

	it('correctly gets file name from path name', function () {
		var testCases = [
			{
				pathname: '/mediawiki116/images/8/81/20150205100502%21phpVtvygX.png' +
				'/revision/latest?cb=20150205100502&zone=temp',
				filename: '20150205100502%21phpVtvygX.png'
			},
			{
				pathname: '/__cb1422890817/candy-crush-saga/images/temp/1/10/' +
				'20150203044502%21phpPNBeRu.png',
				filename: '20150203044502%21phpPNBeRu.png'
			}
		];

		testCases.forEach(function (testCase) {
			expect(utils.getFileNameFromPathName(testCase.pathname)).toEqual(testCase.filename);
		});
	});

	it('generates correct map boundaries', function () {
		// @TODO Add more real cases when the north calculation logic is fixed
		var testSet = [
			{
				width: 256,
				height: 256,
				maxZoom: 0,
				expected: {
					north: 85.0511287798066,
					east: 180,
					south: -90,
					west: -180
				}
			}
		];
		testSet.forEach(function (testCase) {
			expect(JSON.stringify(utils.getMapBoundaries(testCase.width, testCase.height, testCase.maxZoom)))
				.toBe(JSON.stringify(testCase.expected));
		});
	});

	it('returns correct bucket name', function () {
		var testSet = [
			{
				markersPrefix: 'markers_',
				mapId: 1,
				expected: 'markers_1'
			},
			{
				markersPrefix: 2,
				mapId: 3,
				expected: '23'
			}
		];
		testSet.forEach(function (testCase) {
			expect(utils.getMarkersBucketName(testCase.markersPrefix, testCase.mapId))
				.toBe(testCase.expected);
		});
	});

	it('returns correct zoom level', function () {
		var testSet = [
			{
				zoom: 2,
				minZoom: 0,
				maxZoom: 3,
				expected: 2
			},
			{
				zoom: -1,
				minZoom: 0,
				maxZoom: 3,
				expected: 0
			},
			{
				zoom: 5,
				minZoom: 0,
				maxZoom: 3,
				expected: 3
			},
		];
		testSet.forEach(function (testCase) {
			expect(utils.getZoomLevel(testCase.zoom, testCase.minZoom, testCase.maxZoom))
				.toBe(testCase.expected);
		});

	});

	it('returns correct latitude', function () {
		var testSet = [
			{
				latitude: 20.1,
				boundaries: {
					north: 20,
					south: -20,
					east: 20,
					west: -20
				},
				expected: 20.1
			},
			{
				latitude: 0,
				boundaries: {
					north: 20,
					south: -20,
					east: 20,
					west: -20
				},
				expected: 0
			}
		];
		testSet.forEach(function (testCase) {
			expect(utils.getLatitude(testCase.latitude, testCase.boundaries))
				.toBe(testCase.expected);
		});
	});

	it('returns correct longitude', function () {
		var testSet = [
			{
				longitude: 20.1,
				boundaries: {
					north: 20,
					south: -20,
					east: 20,
					west: -20
				},
				expected: 20.1
			},
			{
				longitude: 0,
				boundaries: {
					north: 20,
					south: -20,
					east: 20,
					west: -20
				},
				expected: 0
			}
		];
		testSet.forEach(function (testCase) {
			expect(utils.getLongitude(testCase.longitude, testCase.boundaries))
				.toBe(testCase.expected);
		});
	});

	it('escapes HTML correctly', function () {
		var testSet = [
			{
				input: '<script>alert(\'xss\')</script>',
				expected: '&lt;script&gt;alert(\'xss\')&lt;/script&gt;'
			},
			{
				input: '"Everything is AWESOME & whatnot!"',
				expected: '"Everything is AWESOME &amp; whatnot!"'
			}
		];
		testSet.forEach(function (testCase) {
			expect(utils.escapeHtml(testCase.input))
				.toBe(testCase.expected);
		});
	});

	it('checks functions correctly', function () {
		var testSet = [
			{
				input: true,
				expected: false
			},
			{
				input: 1,
				expected: false
			},
			{
				input: 0x3,
				expected: false
			},
			{
				input: 'as',
				expected: false
			},
			{
				input: {},
				expected: false
			},
			{
				input: function () {},
				expected: true
			}
		];
		testSet.forEach(function (testCase) {
			expect(utils.isFunction(testCase.input)).toBe(testCase.expected);
		});
	});

	it('returns correct unix timestamp', function () {
		var testCases = [
			{
				date: new Date(1),
				expected: 1
			}, {
				date: new Date(Date.UTC(2014, 11, 12, 1, 1, 1)),
				expected: 1418346061
			}
		];
		testCases.forEach(function (testCase) {
			expect(utils.unixTimestamp(testCase.date)).toBe(testCase.expected);
		});

	});
});
