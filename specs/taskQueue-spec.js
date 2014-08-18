describe('taskQueue', function () {
'use strict';

	var proxyquire = require('proxyquire').noCallThru(),
		taskQueue = proxyquire('./../lib/taskQueue', {
			url: {},
			amqplib: {},
			'node-uuid': {
				'v4': function () {
					return 'some-random-id';
				}
			},
			when: {},
			crypto: {
				createHash: function (type) {
					return {
						update: function (param) {
							return {
								digest: function (digestType) {
									return [type, param, digestType].join('-');
								}
							};
						}
					};
				}
			},
			'./config': {},
			'./logger': {},
			'./utils': {
				unixTimestamp: function () {
					return 1;
				}
			}
		});

	it('generates expected payload', function () {
		var testCases = [
			{
				taskType: 1,
				createdBy: 'test',
				workId: 1,
				context: {one: 'love'},
				expected: {
					id: 'im-some-random-id',
					task: 1,
					args: [],
					kwargs: {
						created_ts: 1,
						created_by: {
							name: 'test'
						},
						work_id: 'sha1-1-hex',
						context: {
							one: 'love'
						},
						force: false,
						executor: null
					}
				}
			}
		];

		testCases.forEach(function (testCase) {
			expect(JSON.stringify(
				taskQueue.payload(testCase.taskType, testCase.createdBy, testCase.workId, testCase.context)
			)).toBe(JSON.stringify(
				testCase.expected
			));
		});
	});
});
