/* global jasmine */
'use strict';

var proxyquire = require('proxyquire').noCallThru(),
	stubs = require('./stubs');

describe('Fetch image', function () {

	var res = {
			statusCode: 200,
			on: function () {
				return this;
			}
		},
		http = {
			get: function (x, cb) {
				cb(res);
				return this;
			},
			on: function () {}
		},
		qStub = stubs.newQStub(),
		fsStub = jasmine.createSpyObj('fs', ['createWriteStream']),
		data = {
			fileUrl: 'http:/example.com/image.jpg',
			name: 'Lorem ipsum',
			dir: 'test'
		},
		sendToDFS = jasmine.createSpy('sendToDFS'),
		fetchImage = proxyquire('../lib/fetchImage', {
			http: http,
			url: require('url'),
			fs: fsStub,
			q: qStub.q,
			'./config': {
				bucketPrefix: 'test'
			},
			'./dfs': {
				sendFiles: sendToDFS
			},
			'./logger': {
				debug: function () {},
				info: function () {},
				error: function () {}
			}
		});


	it('creates write stream to save image in fs', function () {
		fetchImage.getFile(data);

		expect(fsStub.createWriteStream).toHaveBeenCalled();
	});

	it('correctly gets filename from url', function () {
		var testCases = [
			{
				url: 'http://vignette2.wikia.nocookie.net/mediawiki116/images/8/81/20150205100502%21phpVtvygX.png' +
				'/revision/latest?cb=20150205100502&zone=temp',
				filename: '20150205100502%21phpVtvygX.png'
			},
			{
				url: 'http://img3.wikia.nocookie.net/__cb1422890817/candy-crush-saga/images/temp/1/10/' +
				'20150203044502%21phpPNBeRu.png',
				filename: '20150203044502%21phpPNBeRu.png'
			}
		];

		testCases.forEach(function (testCase) {
			expect(fetchImage.getFilenameFromUrl(testCase.url)).toEqual(testCase.filename);
		});
	});

	it('creates write stream with proper path', function () {
		var fileName = 'image.jpg';

		fetchImage.getFile(data);

		expect(fsStub.createWriteStream).toHaveBeenCalledWith(data.dir + fileName);
	});

	it('calls http.get to fetch image', function () {
		spyOn(http, 'get').andCallThrough();

		fetchImage.getFile(data);

		expect(http.get).toHaveBeenCalled();
	});

	it('returns correct message if failed to fetch file', function () {
		var response = {
			message: 'Could not fetch file'
		};

		res.statusCode = 0;
		fetchImage.getFile(data);

		expect(qStub.defer.reject).toHaveBeenCalled();
		expect(qStub.defer.reject).toHaveBeenCalledWith(response);

		res.statusCode = 200;
	});
});
