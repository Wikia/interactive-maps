'use strict';

var url = require('url'),
	amqp = require('amqplib'),
	uuid = require('node-uuid'),
	crypto = require('crypto'),
	config = require('./config'),
	logger = require('./logger'),
	utils = require('./utils'),
	queueName = 'interactive_maps',
	taskIdPrefix = 'im-',
	tasks = {
		poiUpdate: 'celery_workers.interactive_maps.parse'
	},
	connectionPromise,
	channelPromise,
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
			//heartbeat: config.taskQueue.heartbeat
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
 * @desc Handle broken connection, try to connect again
 * @param {Object} error
 */
function connectionBroken(error) {
	logger.warning('Connection to AMQP server was broken, trying to reconnect', error);
	connect();
}

/**
 * @desc Handle successful connection, bind events
 *
 * @param {ChannelModel} connection
 * @returns {ChannelModel}
 */
function connectionSuccessful(connection) {
	logger.notice('Connected to AMQP server');

	process.once('SIGINT', connection.close.bind(connection));
	connection.on('error', connectionBroken);

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
		return getConnectionPromise();
	} else {
		logger.alert(errorMessage, error);
		throw new Error(errorMessage);
	}
}

/**
 * @desc Create connection to AMQP server
 *
 * @returns {Promise} - Promise for the connection
 */
function getConnectionPromise() {
	return amqp
		.connect(createTaskBrokerUrl(config))
		.then(connectionSuccessful)
		.catch(connectionError);
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
 * @desc Handle successful creation of channel, assert queue
 *
 * @param {ConfirmChannel} channel
 * @returns {ConfirmChannel}
 */
function channelCreationSuccess(channel) {
	logger.notice('AMQP channel created');

	return channel
		.assertQueue(queueName)
		.then(function () {
			logger.notice('AMQP queue asserted');
			return channel; // return channel promise instead of queue promise
		})
		.catch(queueAssertionError);
}

/**
 * @desc Handle channel creation failure
 *
 * @param {Object} error
 * @throws {Error}
 */
function channelCreationFailure(error) {
	var errorMessage = 'Couldn\'t create AMQP channel';
	logger.error(errorMessage, error);
	throw new Error(errorMessage);
}

/**
 * @desc Connect to AMQP server and create channel
 *
 * @throws {Error}
 */
function connect() {
	connectionRetriesLeft = config.taskQueue.connectionRetries;
	connectionPromise = getConnectionPromise();

	channelPromise = connectionPromise
		.then(function (connection) {
			return connection
				.createConfirmChannel()
				.then(channelCreationSuccess)
				.catch(channelCreationFailure);
		});

	// crash the app if an error is thrown all the way up here
	channelPromise
		.done(null, function (error) {
			throw error;
		});
}

/**
 * @desc Send payload to AMQP server
 *
 * @param {Object} payload - Message to send
 * @param {Number=} retries - Number of retries left
 */
function publish(payload, publishRetriesLeft) {
	publishRetriesLeft = (typeof publishRetriesLeft !== 'undefined') ?
		publishRetriesLeft :
		config.taskQueue.publishRetries;

	if (typeof channelPromise === 'undefined') {
		connect();
	}

	channelPromise.then(function (channel) {
		channel.sendToQueue(
			queueName,
			createBuffer(payload),
			{
				contentType: 'application/json',
				contentEncoding: 'utf-8'
			},
			function (error) {
				if (error === null) {
					logger.debug('AMQP message sent');
				} else {
					var errorMessage = 'AMQP message not sent';

					if (publishRetriesLeft) {
						logger.warning(errorMessage + ', trying again', error);
						publish(payload, --publishRetriesLeft);
					} else {
						logger.error(errorMessage, error);
						throw new Error(errorMessage);
					}
				}
			}
		);
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

module.exports = {
	connect: connect,
	payload: payload,
	publish: publish,
	tasks: tasks
};
