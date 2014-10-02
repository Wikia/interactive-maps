'use strict';

var url = require('url'),
	amqp = require('amqplib'),
	uuid = require('node-uuid'),
	crypto = require('crypto'),
	Q = require('q'),
	config = require('./config'),
	logger = require('./logger'),
	utils = require('./utils'),
	queueName = 'interactive_maps',
	taskIdPrefix = 'im-',
	tasks = {
		poiUpdate: 'celery_workers.interactive_maps.parse'
	},
	channelDeferred,
	channelPromise,
	messagesToSend = {},
	connectionRetriesLeft;

/**
 * @desc Create TaskBroker Connection URI based on config
 *
 * @param {Object} config Config object
 * @returns {String}
 */
function createTaskBrokerUrl(config) {
	return url.format({
		protocol: 'amqp',
		slashes: true,
		auth: config.taskBroker.user + ':' + config.taskBroker.pass,
		hostname: config.taskBroker.host,
		port: config.taskBroker.port,
		query: {
			heartbeat: config.taskQueue.heartbeatInSeconds
		}
	});
}

/**
 * @desc Create new buffer with JSON-ified value of the message
 *
 * @param {Object} message
 * @returns {Object}
 */
function createBuffer(message) {
	return new Buffer(JSON.stringify(message));
}

/**
 * @desc Generate random task id
 *
 * @param {String} taskIdPrefix - Prefix to add before the id
 * @returns {String}
 */
function generateId(taskIdPrefix){
	return taskIdPrefix + uuid.v4();
}

/**
 * @desc Reconnect on broken connection
 * @param {Object} error
 */
function reconnectOnBrokenConnection(error) {
	logger.warning('Connection to AMQP server was broken, trying to reconnect', error);
	setupQueueConnection();
}

/**
 * @desc Setup connection bindings
 *
 * @param {ChannelModel} connection
 * @returns {ChannelModel}
 */
function setupConnectionBindings(connection) {
	logger.notice('Connected to AMQP server');

	process.once('SIGINT', connection.close.bind(connection));
	connection.on('error', reconnectOnBrokenConnection);

	return connection;
}

/**
 * @desc Handle connection error, try to reconnect
 *
 * @param {Object} error
 * @returns {Promise} - Promise for the connection
 * @throws {Error}
 */
function connectionError(error) {
	var errorMessage = 'Couldn\'t connect to AMQP server';
	if (connectionRetriesLeft) {
		logger.warning(errorMessage + ', retrying', error);
		connectionRetriesLeft--;
		return createConnection();
	} else {
		error.messagesFailedToSend = messagesToSend; // they'll be available in syslog to investigate
		logger.alert(errorMessage, error);
		throw new Error(errorMessage);
	}
}

/**
 * @desc Create connection to AMQP server
 *
 * @returns {Promise} - Promise for the connection
 */
function createConnection() {
	return amqp
		.connect(createTaskBrokerUrl(config))
		.then(setupConnectionBindings)
		.catch(connectionError);
}

/**
 * @desc Handle successful channel creation
 *
 * @param {ConfirmChannel} channel
 * @returns {ConfirmChannel}
 */
function channelCreationSuccess(channel) {
	logger.notice('AMQP channel created');
	return channel;
}

/**
 * @desc Handle channel creation failure
 *
 * @param {Object} error
 * @throws {Error}
 */
function channelCreationError(error) {
	var errorMessage = 'Couldn\'t create AMQP channel';
	logger.error(errorMessage, error);
	throw new Error(errorMessage);
}

/**
 * @desc Create AMQP channel
 *
 * @param {ChannelModel} connection - AMQP connection
 * @returns {ConfirmChannel} - AMQP channel
 */
function createChannel(connection) {
	return connection
		.createConfirmChannel()
		.then(channelCreationSuccess)
		.catch(channelCreationError);
}

/**
 * @desc Handle queue assertion error
 *
 * @param {Object} error
 * @throws {Error}
 */
function queueAssertionError(error) {
	var errorMessage = 'Couldn\'t assert AMQP queue';
	logger.error(errorMessage, error);
	throw new Error(errorMessage);
}

/**
 * @desc Send postponed messages after connection is restored
 */
function sendPostponedMessages() {
	for (var id in messagesToSend) {
		publish(messagesToSend[id]);
	}
}

/**
 * @desc Handle successful creation of channel, assert queue
 *
 * @param {ConfirmChannel} channel
 * @returns {ConfirmChannel}
 */
function assertQueue(channel) {
	channel
		.assertQueue(queueName)
		.then(function () {
			logger.notice('AMQP queue asserted');
			channelDeferred.resolve(channel);
			sendPostponedMessages();
		})
		.catch(queueAssertionError);
}

/**
 * @desc Reset connectionRetriesLeft variable with value from config
 */
function resetConnectionRetriesLeft() {
	connectionRetriesLeft = config.taskQueue.connectionRetries;
}

/**
 * @desc Connect to AMQP server and create channel
 *
 * @throws {Error}
 */
function setupQueueConnection() {
	channelDeferred = Q.defer();
	channelPromise = channelDeferred.promise;
	resetConnectionRetriesLeft();

	createConnection()
		.then(createChannel)
		.then(assertQueue)
		.done(null, function () {
			channelDeferred.reject();
		});
}

/**
 * @desc Handle publishing message error, try to send it again
 *
 * @param {Object} payload - Message to send
 * @param {Object} error
 * @param {Number} publishRetriesLeft - Number of retries left
 * @throws {Error}
 */
function publishError(payload, error, publishRetriesLeft) {
	var errorMessage = 'AMQP message nacked by server';

	if (publishRetriesLeft) {
		logger.warning(errorMessage + ', trying again', error);
		publish(payload, --publishRetriesLeft);
	} else {
		logger.error(errorMessage, error);
		throw new Error(errorMessage);
	}
}

/**
 * @desc Send payload to AMQP server
 *
 * @param {Object} payload - Message to send
 * @param {Number=} publishRetriesLeft - Number of retries left
 */
function publish(payload, publishRetriesLeft) {
	publishRetriesLeft = (typeof publishRetriesLeft !== 'undefined') ?
		publishRetriesLeft :
		config.taskQueue.publishRetries;

	channelPromise
		.then(function (channel) {
			if (!messagesToSend[payload.id]) {
				logger.debug('Ready to send AMQP message with id ' + payload.id);
				messagesToSend[payload.id] = payload;
			}

			channel.sendToQueue(
				queueName,
				createBuffer(payload),
				{
					contentType: 'application/json',
					contentEncoding: 'utf-8'
				},
				function (error) {
					logger.debug('AMQP message with id ' + payload.id + ' sent');
					delete messagesToSend[payload.id];

					if (error === null) {
						logger.debug('AMQP message with id ' + payload.id + ' acked by server');
					} else {
						publishError(payload, error, publishRetriesLeft);
					}
				}
			);
		})
		.catch(function () {
			logger.error('AMQP message with id ' + payload.id + ' couldn\'t be sent', payload);
		});
}

/**
 * @desc Generate payload object
 *
 * @param {String} workId - Unique work id
 * @param {String} taskType - Task type
 * @param {String} workId - Unique work id
 * @param {Object} context - Command context
 * @returns {Object}
 */
function payload(taskType, createdBy, workId, context) {
	return {
		id: generateId(taskIdPrefix),
		task: taskType,
		args: [],
		kwargs: {
			created_ts: utils.unixTimestamp(),
			created_by: {
				name: createdBy
			},
			work_id: crypto.createHash('sha1').update(workId).digest('hex'),
			context: context,
			force: false,
			executor: null
		}
	};
}

/**
 * @desc Check if channel promise has been rejected which means broken connection
 *
 * @returns {boolean}
 */
function isHealthy() {
	return !channelPromise.isRejected();
}

module.exports = {
	assertQueue: assertQueue,
	channelCreationError: channelCreationError,
	connectionError: connectionError,
	createConnection: createConnection,
	isHealthy: isHealthy,
	payload: payload,
	publish: publish,
	queueAssertionError: queueAssertionError,
	reconnectOnBrokenConnection: reconnectOnBrokenConnection,
	resetConnectionRetriesLeft: resetConnectionRetriesLeft,
	setupConnectionBindings: setupConnectionBindings,
	setupQueueConnection: setupQueueConnection,
	tasks: tasks
};
