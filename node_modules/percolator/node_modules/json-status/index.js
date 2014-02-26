var dir = './lib/';
if (process.env.JSON_STATUS_COVERAGE){
  dir = './lib-cov/';
}
module.exports = require(dir + 'JsonResponder');
