'use strict';

var gulp = require('gulp');

gulp.task('build', ['node-modules', 'build-dynamic', 'build-static', 'locales', 'cache-buster']);
