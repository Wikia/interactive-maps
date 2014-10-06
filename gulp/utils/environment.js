'use strict';

var gutil = require('gulp-util'),
	environment = gutil.env.type || process.env.WIKIA_ENVIRONMENT || 'dev';

if (environment === 'production') {
	// Wikia convention is to refer to production environment by prod shortcut
	// to refer to dev environment by dev and it's been changed recently in our config:
	// * https://github.com/Wikia/config/pull/674
	// * https://github.com/Wikia/interactive-maps/pull/217
	// unfortunately npm install accepts only --production flag and it was "borrowed" to
	// deploytools-plugin helpers:
	// * https://github.com/Wikia/deploytools-plugins/blob/master/wikia/deploytools_plugins/_utils/gulp.py#L14
	// we don't want to change it in deploytools-plugins and we came with this workaround
	// we plan to clean it up after switching to Mercury Project
	environment = 'prod';
}

process.env.WIKIA_ENVIRONMENT = environment;

module.exports = {
	name: environment,
	isProduction: environment === 'prod',
	isDev: environment === 'dev'
};
