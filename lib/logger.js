var Syslog = require( 'node-syslog' ),
	fs = require( 'fs'),
		toCon = false,
		toConLvl = Syslog.LOG_NOTICE,
		toFile = false,
		toFileLvl = Syslog.LOG_NOTICE,
		fileName = null,
		toSyslog = false,
		toSyslogLvl = Syslog.LOG_NOTICE;
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
 * @param level
 * @param message
 * @param context
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
 * @param level
 * @param message
 * @param context
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
 * @param level
 * @param message
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
 * @param level
 * @param message
 */
function logToConsole ( level, message ) {
	if ( toCon && level <= toConLvl ) {
		var date = ( !raw ) ? new Date().toGMTString() : '';
		console.log( headings[level] + ' ' + date + ' ' + message );
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
	 * @desc Logs debugging message
	 * @param message
	 * @param context
	 */
	debug : function ( message, context ) {
		log( Syslog.LOG_DEBUG, message, context );
	},

	info : function ( message, context ) {
		log( Syslog.LOG_INFO, message, context );
	},

	notice : function ( message, context ) {
		log( Syslog.LOG_NOTICE, message, context );
	},

	warning : function ( message, context ) {
		log( Syslog.LOG_WARNING, message, context );
	},

	error : function ( message, context ) {
		log( Syslog.LOG_ERR, message, context );
	},

	critical : function ( message, context ) {
		log( Syslog.LOG_CRIT, message, context );
	},

	alert : function ( message, context ) {
		log( Syslog.LOG_ALERT, message, context );
	},

	emergency : function ( message, context ) {
		log( Syslog.LOG_EMERG, message, context );
	},

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
			}
		}
		Syslog.init( 'intMaps' , Syslog.LOG_PID | Syslog.LOG_ODELAY, Syslog.LOG_LOCAL0 );
	},

	close : function () {
		Syslog.close();
	}
};
