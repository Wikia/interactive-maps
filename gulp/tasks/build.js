'use strict';

var gulp = require('gulp');

// TODO when node-modules task is enabled I get error:
// Error: Error in plugin 'gulp-useref'
// EMFILE, too many open files
gulp.task('build', [/*'node-modules', */'front', 'copy-files', 'locales', 'cache-buster']);
