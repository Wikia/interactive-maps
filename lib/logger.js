/**
 * @desc Module used for centralized logging messages
 * @type {exports}
 */
var Syslog = require( 'node-syslog' ),
	fs = require( 'fs'),
		toCon = false,
		toConLvl = Syslog.LOG_NOTICE,
		toFile = false,
		toFileLvl = Syslog.LOG_NOTICE,
		fileName = null,
		toSyslog = false,
		toSyslogLvl = Syslog.LOG_NOTICE,
		raw = false,
		headings = [
			'[EMERGENCY] ',
			'[ALERT] ',
			'[CRITICAL] ',
			'[ERROR] ',
			'[WARNING] ',
			'[NOTICE] ',
			'[INFO] ',
			'[DEBUG] '
		];

/**
 * @desc Handle logging to all the platforms
 * @param {Number} level
 * @param {String} message
 * @param {Object} context
 */
function log ( level, message, context ) {
	if ( context && typeof context !== 'object' ) {
		throw new Error( 'Context should be an object' );

	} else {
		logToSyslog( level, message, context );
		logToFile( level, message );
		logToConsole( level, message );
	}
}

/**
 * @desc Logs to syslog in using node-syslog module
 * @param {Number} level
 * @param {String} message
 * @param {Object} context
 */
function logToSyslog ( level, message, context ) {
	if ( toSyslog && level <= toSyslogLvl ) {
		Syslog.log( level, JSON.stringify(
			{
				'@message' : message,
				'@context' : context
			}
		) );
	}
}

/**
 * @desc Logs to local file
 * @param {Number} level
 * @param {String} message
 */
function logToFile ( level, message ) {
	if ( toFile && level <= toFileLvl ) {
		var date = ( !raw ) ? new Date().toGMTString() + ' ' : '';
		fs.appendFile(
			fileName,
			 date + headings[level] + message + '\n',
			function ( error ) {

			}
		);
	}
}

/**
 * @desc Logs to Node console
 * @param {Number} level
 * @param {String} message
 */
function logToConsole ( level, message ) {
	if ( toCon && level <= toConLvl ) {
		var date = ( !raw ) ? new Date().toGMTString() + ' ' : '';
		console.log( date + headings[level] + ' ' + message );
	}
}

module.exports = {
	severity : {
		DEBUG : Syslog.LOG_DEBUG,
		INFO : Syslog.LOG_INFO,
		NOTICE : Syslog.LOG_NOTICE,
		WARNING : Syslog.LOG_WARNING,
		ERROR : Syslog.LOG_ERR,
		CRITICAL : Syslog.LOG_CRIT,
		ALERT : Syslog.LOG_ALERT,
		EMERGENCY : Syslog.LOG_EMERG
	},

	/**
	 * @desc Logs message with severity level: debug
	 * @param {String} message
	 * @param {Object} context
	 */
	debug : function ( message, context ) {
		log( Syslog.LOG_DEBUG, message, context );
	},

	/**
	 * @desc Logs message with severity level: info
	 * @param {String} message
	 * @param {Object} context
	 */
	info : function ( message, context ) {
		log( Syslog.LOG_INFO, message, context );
	},

	/**
	 * @desc Logs message with severity level: notice
	 * @param {String} message
	 * @param {Object} context
	 */
	notice : function ( message, context ) {
		log( Syslog.LOG_NOTICE, message, context );
	},

	/**
	 * @desc Logs message with severity level: warning
	 * @param {String} message
	 * @param {Object} context
	 */
	warning : function ( message, context ) {
		log( Syslog.LOG_WARNING, message, context );
	},

	/**
	 * @desc Logs message with severity level: error
	 * @param {String} message
	 * @param {Object} context
	 */
	error : function ( message, context ) {
		log( Syslog.LOG_ERR, message, context );
	},

	/**
	 * @desc Logs message with severity level: critical
	 * @param {String} message
	 * @param {Object} context
	 */
	critical : function ( message, context ) {
		log( Syslog.LOG_CRIT, message, context );
	},

	/**
	 * @desc Logs message with severity level: alert
	 * @param {String} message
	 * @param {Object} context
	 */
	alert : function ( message, context ) {
		log( Syslog.LOG_ALERT, message, context );
	},

	/**
	 * @desc Logs message with severity level: emergency
	 * @param {String} message
	 * @param {Object} context
	 */
	emergency : function ( message, context ) {
		log( Syslog.LOG_EMERG, message, context );
	},

	/**
	 * @desc Initializes logger with the given options
	 * @param {Object} options
	 */
	init : function ( options ) {
		if ( typeof options === 'object' ) {
			var optToCon = options.toConsole,
				optToFile = options.toFile,
				optPath = options.filePath,
				optToSyslog = options.toSyslog;

			//Console Setup
			if ( optToCon && typeof optToCon === 'number' && optToCon >= 0 && optToCon <= 7 ) {
				toCon = true;
				toConLvl = optToCon;
				raw = !!options.raw;
			}
			//Local log file setup
			if ( optToFile && typeof optToFile === 'number' && optToFile >= 0 && optToFile <= 7 ) {
				toFile = true;
				toFileLvl = optToFile;
				fileName = ( optPath ) ? optPath : 'main.log';
				console.log('hello');
			}
			//Syslog setup
			if ( optToSyslog && typeof optToSyslog === 'number' && optToSyslog >= 0 && optToSyslog <= 7 ) {
				toSyslog = true;
				toSyslogLvl = optToSyslog;
				Syslog.init( 'intMaps' , Syslog.LOG_PID | Syslog.LOG_ODELAY, Syslog.LOG_LOCAL0 );
			}
		}
	},

	/**
	 * @desc Closes syslog connection
	 */
	close : function () {
		if ( toSyslog ) {
			Syslog.close();
		}
	}
};
