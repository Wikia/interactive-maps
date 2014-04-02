'use strict';

var yaml = require('js-yaml'),
	fs = require('fs'),
	configuration,
	confPath = process.env.WIKIA_DOCROOT + '/interactiveMapsConfig.yml';

try {
	configuration = yaml.safeLoad(
		fs.readFileSync(confPath, 'utf8')
	);

	console.log('Using conf file:', confPath, 'for process id:' , process.pid);
} catch (e) {
	throw 'Problem with config: ' + e;
}

configuration.setRoot = function(dir){
	dir = dir || '';

	configuration.tmp = dir + configuration.tmp;
	configuration.root = dir;
};

module.exports = configuration;
