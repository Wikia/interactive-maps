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
	channelPromise;

/**
 * @desc Create TaskBroker Connection URI based on config
 *
 * @param {object} config Config object
 * @returns {string}
 */
function createTaskBrokerUrl(config) {
	return url.format({
		protocol: 'amqp',
		slashes: true,
		auth: config.taskBroker.user + ':' + config.taskBroker.pass,
		hostname: config.taskBroker.host,
		port: config.taskBroker.port,
		query: {
			heartbeat: config.taskQueue.heartbeat || 10
		}
	});
}

/**
 * @desc Create new buffer with JSON-ified value of the message
 *
 * @param {object} message Object
 * @returns {object}
 */
function createBuffer(message) {
	return new Buffer(JSON.stringify(message));
}

/**
 * @desc Generate random task id
 *
 * @param {string} taskIdPrefix Prefix to add before the id
 * @returns {string}
 */
function generateId(taskIdPrefix){
	return taskIdPrefix + uuid.v4();
}

function connect() {
	connectionPromise = amqp.connect(createTaskBrokerUrl(config))
		.then(function (conn) {
			logger.info('Connected to AMQP server');
			return conn;
		}, function (err) {
			//TODO how to recover?
			logger.alert('Couldn\'t connect to AMQP server', err);
		});

	channelPromise = connectionPromise.then(function (conn) {
		process.once('SIGINT', conn.close.bind(conn));

		return conn.createConfirmChannel()
			.then(function (ch) {
				logger.info('AMQP channel created');

				return ch.assertQueue(queueName)
					.then(function () {
						logger.info('AMQP queue asserted');
						return ch;
					}, function (err) {
						//TODO how to recover?
						logger.error('Couldn\'t assert AMQP queue', err);
						return ch;
					});
			}, function (err) {
				//TODO how to recover?
				logger.error('Couldn\'t create AMQP channel', err);
			});
	});
}

//TODO is it needed anywhere? it's not used yet
function disconnect() {
	connectionPromise.then(function (conn) {
		conn.close()
			.then(function () {
				logger.info('Disconnected from AMQP server');
			});
	});
}

function publish(payload) {
	//TODO connect if not connected
	channelPromise.then(function (ch) {
		ch.sendToQueue(
			queueName,
			createBuffer(payload),
			{
				contentType: 'application/json',
				contentEncoding: 'utf-8'
			},
			function (err) {
				if (err !== null) {
					//TODO how to recover?
					logger.error('Message nacked', err);
				} else {
					logger.info('Message acked');
					//TODO remove it
					console.log(payload);
				}
			}
		);
	});
}

/**
 * @desc Generate payload object
 *
 * @param {string} workId Unique work id
 * @param {string} taskType Task type
 * @param {string} workId Unique work id
 * @param {object} context Command context
 * @returns {object}
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
