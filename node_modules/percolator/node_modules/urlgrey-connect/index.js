var dir = './lib/';
if (process.env.urlgreyConnect_COVERAGE){
  dir = './lib-cov/';
}
module.exports = require(dir + 'urlgrey-connect');
