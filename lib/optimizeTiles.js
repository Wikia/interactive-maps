var Q = require('q'),
	exec = require('child_process').exec,
	config = require('./config');

/**
 * @desc optimize tile images
 * @param data {object} - object with tiles data
 * @returns {object} - promise
 */

module.exports = function optimizeTiles(data) {
	var deferred = Q.defer(),
		folders = '{' + data.minZoom + '..' + data.maxZoom + '}',
		cmd = 'optipng -o7 ' + data.dir + '/' + folders + '/**/*.png',
		duCommand = 'du -sh ' + data.dir;

	if (config.optimize !== false) {
		console.log('Optimizing tiles in folder:', data.dir);
		console.log('With command:', cmd);

		exec(duCommand, function (error, stdout, stderr) {
			console.log(stdout.trim());

			exec(cmd, function (error, stdout, stderr) {
				console.log(stdout);

				exec(duCommand, function (error, stdout, stderr) {
					console.log(stdout.trim());

					deferred.resolve(data);
				});
			});
		});
	} else {
		console.log('Optimizing images disabled');
		deferred.resolve(data);
	}

	return deferred.promise;
};
