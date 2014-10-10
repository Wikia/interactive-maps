/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
var config = require('../lib/config').newrelic,
	logger = require('../lib/logger');

logger.set({
	console: {
		enabled: true,
		level: logger.level.DEBUG,
		raw: true
	}
});

logger.debug('New Relic module loaded (for app: ' + config.appName + ').');

exports.config = {
    /**
     * Array of application names.
     */
    app_name: [config.appName],
    /**
     * Your New Relic license key.
     */
    license_key: config.licenceKey,
    logging: {
        /**
         * Level at which to log. 'trace' is most useful to New Relic when diagnosing
         * issues with the agent, 'info' and higher will impose the least overhead on
         * production applications.
         */
        level: config.logLevel
    }
};
