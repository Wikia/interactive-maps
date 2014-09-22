'use strict';

var gutil = require('gulp-util');

module.exports = function () {
	var args = Array.prototype.slice.call(arguments, 0);

	return gutil.log.apply(null, [gutil.colors.cyan('[INFO]')].concat(args));
};
