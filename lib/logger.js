var Syslog = require( 'node-syslog' ),
	fs = require( 'fs' );

	config = {
		toCon : false,
		toConLvl : Syslog.LOG_NOTICE,
		toFile : false,
		toFileLvl : Syslog.LOG_NOTICE,
		fileName : null
	}

function log ( level, message, context ) {
	if ( context && typeof context !== object ) {

	} else {
		Syslog.log( level, JSON.stringify(
			{
				'@message' : message,
				'@context' : context
			}
		) );
	}

	logToFile( level, message, context );
	logToConsole( level, message, context );
}

function logToFile ( level, message, context ) {
	if ( level >= config.toFileLvl ) {
		fs.appendFile(
			config.fileName,
			new Date() + ' ' + message + '\n',
			function ( error ) {
				if ( error ) {
					throw error;
				}
			}
		);
	}
}

function logToConsole ( level, message, context ) {
	if ( level >= config.toConLvl ) {
		console.log( message );
	}
}

module.exports = {
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
			var toCon = options.toConsole,
				toFile = options.toFile,
				path = options.filePath;
			if ( toCon && typeof toCon === 'number' && toCon >= 0 && toCon <= 7 ) {
				config.toCon = true;
				config.toConLvl = toCon;
			}
			if ( toFile && typeof toFile === 'number' && toFile >= 0 && toFile <= 7 ) {
				config.toFile = true;
				config.toFileLvl = toFile;
				config.fileName = ( !options.filePath ) ? 'main.log' : path;
			}
		}
		Syslog.init( 'intMaps' , Syslog.LOG_PID | Syslog.LOG_ODELAY, Syslog.LOG_LOCAL0 );
	},

	close : function () {
		Syslog.close();
	}
};
