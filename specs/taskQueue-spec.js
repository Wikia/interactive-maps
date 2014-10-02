/* global jasmine */
'use strict';

describe('taskQueue', function () {
	var proxyquire = require('proxyquire').noCallThru(),
		loggerStub = jasmine.createSpyObj('logger', ['alert', 'error', 'warning', 'notice']),
		amqplibChannelStub = {
			assertQueue: function () {
				return {
					then: function () {
						return {
							catch: function () {}
						};
					}
				};
			},
			sendToQueue: function () {}
		},
		amqplibConnectionStub = {
			close: function () {},
			createConfirmChannel: function () {
				return {
					then: function (cb) {
						cb(amqplibChannelStub);

						return {
							catch: function () {}
						};
					}
				};
			},
			on: function () {}
		},
		amqplibStub = {
			connect: function () {
				return {
					then: function (cb) {
						cb(amqplibConnectionStub);

						return {
							catch: function () {
								return {
									then: function (cb) {
										cb(amqplibConnectionStub);

										return {
											then: function () {
												return {
													done: function () {}
												};
											}
										};
									}
								};
							}
						};
					}
				};
			}
		},
		config = {
			taskBroker: {
				user: 'user',
				pass: 'pass',
				host: 'host',
				port: 123
			},
			taskQueue: {
				connectionRetries: 1
			}
		},
		taskQueue = proxyquire('./../lib/taskQueue', {
			url: {
				format: function () {}
			},
			amqplib: amqplibStub,
			'node-uuid': {
				'v4': function () {
					return 'some-random-id';
				}
			},
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
			'./config': config,
			'./logger': loggerStub,
			'./utils': {
				unixTimestamp: function () {
					return 1;
				}
			}
		});

	it('asserts queue', function () {
		spyOn(amqplibChannelStub, 'assertQueue').andCallThrough();
		taskQueue.assertQueue(amqplibChannelStub);
		expect(amqplibChannelStub.assertQueue).toHaveBeenCalled();
	});

	it('handles channel creation error', function () {
		var error = {
				message: 'test'
			},
			errorMessage = 'Couldn\'t create AMQP channel';

		expect(function () {
			taskQueue.channelCreationError(error);
		}).toThrow(new Error(errorMessage));

		expect(loggerStub.error).toHaveBeenCalledWith(errorMessage, error);
	});

	it('handles connection error', function () {
		var error = {
				message: 'test'
			},
			errorMessage = 'Couldn\'t connect to AMQP server';

		spyOn(amqplibStub, 'connect').andCallThrough();

		//first try
		taskQueue.resetConnectionRetriesLeft();
		taskQueue.connectionError(error);
		expect(amqplibStub.connect).toHaveBeenCalled();
		expect(loggerStub.warning).toHaveBeenCalledWith(errorMessage + ', retrying', error);

		//second try
		expect(function () {
			taskQueue.connectionError(error);
		}).toThrow(new Error(errorMessage));
		expect(loggerStub.alert).toHaveBeenCalledWith(errorMessage, error);
	});

	it('creates connection', function () {
		//spyOn(amqplibChannelStub, 'assertQueue').andCallThrough();
		//spyOn(amqplibConnectionStub, 'createConfirmChannel').andCallThrough();
		spyOn(amqplibStub, 'connect').andCallThrough();

		taskQueue.createConnection();

		//expect(amqplibChannelStub.assertQueue).toHaveBeenCalled();
		//expect(amqplibConnectionStub.createConfirmChannel).toHaveBeenCalled();
		expect(amqplibStub.connect).toHaveBeenCalled();
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

	//it('sends message to server', function () {
	//	spyOn(amqplibChannelStub, 'sendToQueue');
	//
	//	taskQueue.publish({
	//		message: 'test'
	//	});
	//
	//	expect(amqplibChannelStub.sendToQueue).toHaveBeenCalled();
	//});

	it('reconnects on broken connection', function () {
		var error = {
			message: 'test'
		};

		spyOn(amqplibStub, 'connect').andCallThrough();
		taskQueue.reconnectOnBrokenConnection(error);
		expect(loggerStub.warning).toHaveBeenCalledWith(
			'Connection to AMQP server was broken, trying to reconnect',
			error
		);
		expect(amqplibStub.connect).toHaveBeenCalled();
	});
});
