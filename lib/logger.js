/**
 * @desc Singleton Module used for centralized logging messages
 * with 8 syslog-compliant severity levels
 *
 * Usage:
 * getInstance() for obtaining logger
 * Set the config with : set( options )
 * Use one of the 8 log functions to communicate
 * options should mirror config object
 *
 * @type {exports}
 */
'use strict';

var Syslog = require('node-syslog'),
	fs = require('fs'),
	os = require('os'),
	instance;

/**
 * @desc Obtains date string in ISO format
 * @returns {string}
 */
function getISODate() {
	return new Date().toISOString();
}

/**
 * @desc Constructs a config file with default values
 * @constructor
 */
function Config() {
	this.file = {
		enabled: false,
		level: Syslog.LOG_NOTICE,
		path: getISODate() + '.log',
		raw: false
	};
	this.console = {
		enabled: false,
		level: Syslog.LOG_NOTICE,
		raw: false
	};
	this.syslog = {
		enabled: false,
		level: Syslog.LOG_NOTICE,
		tag: 'Interactive Maps'
	};
	this.headings = {
		emergency: '[EMERGENCY] ',
		alert: '[ALERT] ',
		critical: '[CRITICAL] ',
		error: '[ERROR] ',
		warning: '[WARNING] ',
		notice: '[NOTICE] ',
		info: '[INFO] ',
		debug: '[DEBUG] '
	};
}

/**
 * @desc Produces a logger instance
 * @returns {object}
 * @constructor
 */
function Logger() {
	var config = new Config(),
		syslogOn = false,
		fileStream;

	/**
	 * @desc Handle logging to all the platforms
	 * @param {number} level
	 * @param {string} heading
	 * @param {string} message
	 * @param {object} context
	 */
	function log(level, heading, message, context) {
		toSyslog(level, message, context);
		toFile(level, heading, message);
		toConsole(level, heading, message);
	}

	/**
	 * @desc Logs to syslog in using node-syslog module
	 * @param {number} level
	 * @param {string} message
	 * @param {object} context
	 */
	function toSyslog(level, message, context) {
		if (config.syslog.enabled && level <= config.syslog.level) {
			if (context && typeof context !== 'object') {
				throw new Error('Context should be an object');
			}
			if (!syslogOn) {
				Syslog.init(config.syslog.tag, Syslog.LOG_PID | Syslog.LOG_ODELAY, Syslog.LOG_LOCAL0);
				syslogOn = true;
			}
			Syslog.log(level, JSON.stringify({
				'@message': message,
				'@context': context,
				'@timestamp': getISODate()
			}));
		}
	}

	/**
	 * @desc Logs to local file
	 * @param {number} level
	 * @param {string} heading
	 * @param {string} message
	 */
	function toFile(level, heading, message) {
		if (config.file.enabled && level <= config.file.level) {
			if (!fileStream) {
				fileStream = fs.createWriteStream(config.file.path);
			}
			if (fileStream.path !== config.file.path) {
				fileStream.end();
				fileStream = fs.createWriteStream(config.file.path);
			}
			var date = (!config.file.raw) ? getISODate() + ' ' : '';
			fileStream.write(
				date + heading + buildMessage(message) + os.EOL
			);
		}
	}

	/**
	 * @desc Logs to Node console
	 * @param {number} level
	 * @param {string} heading
	 * @param {string} message
	 */
	function toConsole(level, heading, message) {
		if (config.console.enabled && level <= config.console.level) {
			var date = (!config.console.raw) ? getISODate() + ' ' : '';
			console.log(date + heading + buildMessage(message));
		}
	}

	/**
	 * @desc Builds a message string from an unlimited number of params
	 * @returns {string}
	 */
	function buildMessage () {
		var message = [];
		for (var i = 0; i < arguments.length; i++) {
			message.push((typeof arguments[i] === 'string') ? arguments[i] : JSON.stringify(arguments[i]));
		}
		return message.join(' ');
	}

	/**
	 * @desc Resets all the properties to their default values
	 */
	function reset() {
		config = new Config();
	}

	/**
	 * @desc Recursively extend confLevel object with optLevel values (not new properties)
	 * @param {object} optLevel - set of new values
	 * @param {object} confLevel - object to be extent
	 */
	function extend(optLevel, confLevel) {
		if (typeof optLevel === 'object' && typeof confLevel === 'object') {
			for (var prop in optLevel) {
				if (confLevel.hasOwnProperty(prop) && optLevel.hasOwnProperty(prop)) {
					if (typeof optLevel[prop] === 'object') {
						extend(optLevel[prop], confLevel[prop]);
					} else {
						confLevel[prop] = optLevel[prop];
					}
				}
			}
		}
	}

	/**
	 * @desc Set the parameters of the logger
	 * @param {object} options
	 */
	function set(options) {
		if (typeof options === 'object') {
			extend(options, config);
		}
	}

	/**
	 * @desc Logs basic params of HTTP req/res
	 * @param req
	 * @param res
	 * @param startTime
	 */
	function logHttp(req, res, startTime) {
		var processTime = new Date().getTime() - startTime,
			context = getFullContext(req, res.statusCode, processTime),
			message = buildMessage(req.ip, 'requested', req.method, 'on', req.path,
				'Response:', res.statusCode, 'Process Time:', processTime, 'ms');

		if (res.statusCode >= 500) {
			error(message, context);
		} else {
			if (res.statusCode >= 400) {
				warning(message, context);
			} else {
				debug(message, context);
			}
		}
	}

	/**
	 * @desc Logs message with severity level: debug
	 * @param {string} message
	 * @param {object} context
	 */
	function debug(message, context) {
		log(Syslog.LOG_DEBUG, config.headings.debug, message, context);
	}

	/**
	 * @desc Logs message with severity level: info
	 * @param {string} message
	 * @param {object} context
	 */
	function info(message, context) {
		log(Syslog.LOG_INFO, config.headings.info, message, context);
	}

	/**
	 * @desc Logs message with severity level: notice
	 * @param {string} message
	 * @param {object} context
	 */
	function notice(message, context) {
		log(Syslog.LOG_NOTICE, config.headings.notice, message, context);
	}

	/**
	 * @desc Logs message with severity level: warning
	 * @param {string} message
	 * @param {object} context
	 */
	function warning(message, context) {
		log(Syslog.LOG_WARNING, config.headings.warning, message, context);
	}

	/**
	 * @desc Logs message with severity level: error
	 * @param {string} message
	 * @param {object} context
	 */
	function error(message, context) {
		log(Syslog.LOG_ERR, config.headings.error, message, context);
	}

	/**
	 * @desc Logs message with severity level: critical
	 * @param {string} message
	 * @param {object} context
	 */
	function critical(message, context) {
		log(Syslog.LOG_CRIT, config.headings.critical, message, context);
	}

	/**
	 * @desc Logs message with severity level: alert
	 * @param {string} message
	 * @param {object} context
	 */
	function alert(message, context) {
		log(Syslog.LOG_ALERT, config.headings.alert, message, context);
	}

	/**
	 * @desc Logs message with severity level: emergency
	 * @param {string} message
	 * @param {object} context
	 */
	function emergency(message, context) {
		log(Syslog.LOG_EMERG, config.headings.emergency, message, context);
	}


	/**
	 * @desc Helper function to get context from request
	 * @param {object} req http request
	 * @param {number} [status] Http status
	 * @returns {object}
	 */
	function getContext(req, status) {
		return {
			response: status,
			url: req.url,
			verb: req.method
		};
	}

	/**
	 * @desc Helper function to get a full context
	 * @param {object} req
	 * @param {number} status
	 * @param {number} [processTime]
	 * @returns {object}
	 */
	function getFullContext (req, status, processTime) {
		return {
			clientip: req.ip,
			hostname: req.hostname,
			verb: req.method,
			url: req.url,
			response: status,
			processTime: processTime
		}
	}

	return {
		level: {
			DEBUG: Syslog.LOG_DEBUG,
			INFO: Syslog.LOG_INFO,
			NOTICE: Syslog.LOG_NOTICE,
			WARNING: Syslog.LOG_WARNING,
			ERROR: Syslog.LOG_ERR,
			CRITICAL: Syslog.LOG_CRIT,
			ALERT: Syslog.LOG_ALERT,
			EMERGENCY: Syslog.LOG_EMERG
		},

		debug: debug,
		info: info,
		notice: notice,
		warning: warning,
		error: error,
		critical: critical,
		alert: alert,
		emergency: emergency,

		/**
		 * @desc Middleware method for logging HTTP req / res
		 * @param req
		 * @param res
		 * @param next
		 */
		middleware: function (req, res, next) {
			var startTime = new Date().getTime();
			res.on('finish', function () {
				logHttp(req, res, startTime);
			});
			res.on('close', function () {
				logHttp(req, res, startTime);
			});
			if (next) {
				next();
			}
		},

		set: set,
		reset: reset,
		getContext: getContext,
		getFullContext: getFullContext,
		buildMessage: buildMessage,

		/**
		 * @desc Resets all the values and closes any third-party processes
		 */
		close: function () {
			if (syslogOn) {
				Syslog.close();
				syslogOn = false;
			}
			if (fileStream) {
				fileStream.end();
			}
			reset();
		}
	};
}

module.exports = (function () {
	return instance ? instance : instance = new Logger();
})();
