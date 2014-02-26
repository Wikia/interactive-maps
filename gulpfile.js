var gulp = require('gulp'),
	nodemon = require('gulp-nodemon');

gulp.task('default', ['dev'], function(){

});

gulp.task('dev', function(){
	nodemon({ script: 'server.js', ext: 'js' })
});
