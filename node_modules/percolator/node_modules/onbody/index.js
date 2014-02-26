var dir = './lib/';
if (process.env.ONBODYMIDDLEWARE_COVERAGE){
  dir = './lib-cov/';
}
module.exports = require(dir + 'onBodyMiddleware');
