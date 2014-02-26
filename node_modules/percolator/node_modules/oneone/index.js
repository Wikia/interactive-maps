var dir = './lib/';
if (process.env.ONEONE_COVERAGE){
  var dir = './lib-cov/';
}
module.exports = require(dir + 'Server');
