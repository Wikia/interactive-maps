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

var syslog = require('node-syslog'),
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
		level: syslog.LOG_NOTICE,
		path: getISODate() + '.log',
		raw: false
	};
	this.console = {
		enabled: false,
		level: syslog.LOG_NOTICE,
		raw: false
	};
	this.syslog = {
		enabled: false,
		level: syslog.LOG_NOTICE,
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
				syslog.init(config.syslog.tag, syslog.LOG_PID | syslog.LOG_ODELAY, syslog.LOG_LOCAL0);
				syslogOn = true;
			}
			syslog.log(level, JSON.stringify({
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
				date + heading + message + os.EOL
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
			console.log(date + heading + JSON.stringify(message));
		}
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

	return {
		level: {
			DEBUG: syslog.LOG_DEBUG,
			INFO: syslog.LOG_INFO,
			NOTICE: syslog.LOG_NOTICE,
			WARNING: syslog.LOG_WARNING,
			ERROR: syslog.LOG_ERR,
			CRITICAL: syslog.LOG_CRIT,
			ALERT: syslog.LOG_ALERT,
			EMERGENCY: syslog.LOG_EMERG
		},

		/**
		 * @desc Logs message with severity level: debug
		 * @param {string} message
		 * @param {object} context
		 */
		debug: function (message, context) {
			log(syslog.LOG_DEBUG, config.headings.debug, message, context);
		},

		/**
		 * @desc Logs message with severity level: info
		 * @param {string} message
		 * @param {object} context
		 */
		info: function (message, context) {
			log(syslog.LOG_INFO, config.headings.info, message, context);
		},

		/**
		 * @desc Logs message with severity level: notice
		 * @param {string} message
		 * @param {object} context
		 */
		notice: function (message, context) {
			log(syslog.LOG_NOTICE, config.headings.notice, message, context);
		},

		/**
		 * @desc Logs message with severity level: warning
		 * @param {string} message
		 * @param {object} context
		 */
		warning: function (message, context) {
			log(syslog.LOG_WARNING, config.headings.warning, message, context);
		},

		/**
		 * @desc Logs message with severity level: error
		 * @param {string} message
		 * @param {object} context
		 */
		error: function (message, context) {
			log(syslog.LOG_ERR, config.headings.error, message, context);
		},

		/**
		 * @desc Logs message with severity level: critical
		 * @param {string} message
		 * @param {object} context
		 */
		critical: function (message, context) {
			log(syslog.LOG_CRIT, config.headings.critical, message, context);
		},

		/**
		 * @desc Logs message with severity level: alert
		 * @param {string} message
		 * @param {object} context
		 */
		alert: function (message, context) {
			log(syslog.LOG_ALERT, config.headings.alert, message, context);
		},

		/**
		 * @desc Logs message with severity level: emergency
		 * @param {string} message
		 * @param {object} context
		 */
		emergency: function (message, context) {
			log(syslog.LOG_EMERG, config.headings.emergency, message, context);
		},

		set: set,

		reset: reset,

		/**
		 * @desc Resets all the values and closes any third-party processes
		 */
		close: function () {
			if (syslogOn) {
				syslog.close();
				syslogOn = false;
			}
			if (fileStream) {
				fileStream.end();
			}
			reset();
		},

		/**
		 * @desc Helper function to get context from request
		 * @param {number} status Http status
		 * @param {object} req http request
		*/
		getContext: function getContext(status, req){
			return {
				response: status,
				url: req.url,
				method: req.method
			};
		}
	};
}

module.exports = (function () {
	return instance ? instance : instance = new Logger();
})();
