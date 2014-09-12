'use strict';

var gulp = require('gulp');

gulp.task('default', ['build'], function () {
	gulp.start('server', 'watch');
});
