'use strict';

var gulp = require('gulp');

gulp.task('build', ['node-modules', 'front', 'locales', 'copy-files', 'cache-buster']);
