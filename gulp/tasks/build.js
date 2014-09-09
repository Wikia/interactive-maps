'use strict';

var gulp = require('gulp');

gulp.task('build', ['front', 'locales', 'copy-files', 'cache-buster']);
