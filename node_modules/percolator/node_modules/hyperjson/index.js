var dir = './lib/';
if (process.env.HYPERJSON_COVERAGE){
  dir = './lib-cov/';
}
module.exports = require(dir + 'HyperJson');
