'use strict';

module.exports = function (config) {
	config.set({
		basePath: '../',
		frameworks: ['jasmine'],
		browsers: ['PhantomJS'],
		detectBrowsers: {
			enabled: false
		},
		autoWatch: true,
		port: 9876,
		runnerPort: 9100,
		colors: true,
		logLevel: config.LOG_INFO,
		captureTimeout: 10000,
		singleRun: false
	});

};
