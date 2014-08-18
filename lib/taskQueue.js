'use strict';

var url = require('url'),
	amqp = require('amqplib'),
	uuid = require('node-uuid'),
	when = require('when'),
	crypto = require('crypto'),
	config = require('./config'),
	logger = require('./logger'),
	utils = require('./utils'),
	queueName = 'interactive_maps',
	taskIdPrefix = 'im-',
	tasks = {
		poiUpdate: 'celery_workers.interactive_maps.parse'
	};

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
		auth: config.user + ':' + config.pass,
		hostname: config.host,
		port: config.port
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
 * @param {string} idPrefix Prefix to add before the id
 * @returns {string}
 */
function generateId(taskIdPrefix){
	return taskIdPrefix + uuid.v4();
}

/**
 * @desc Publish payload to amqp endpoint
 * 
 * @param {object} payload Payload to send
 */
function publish(payload) {
	if (config.taskBroker && config.taskQueue && config.taskQueue.enabled) {
		amqp.connect(createTaskBrokerUrl(config.taskBroker))
			.then(function (conn) {
				return when(conn.createChannel().then(function (ch) {
					var ok = ch.assertQueue(queueName);
					return ok.then(function () {
						ch.sendToQueue(
							queueName,
							createBuffer(payload),
							{
								contentType: 'application/json',
								contentEncoding: 'utf-8'
							}
						);
						return ch.close();
					});
				}))
				.ensure(function () {
					conn.close();
				});
			})
			.then(null, function (err) {
				logger.error(err);
			});
	}
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
	publish: publish,
	payload: payload,
	tasks: tasks
};
