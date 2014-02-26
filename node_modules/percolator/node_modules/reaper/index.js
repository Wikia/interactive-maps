var dir = './lib/';
if (process.env.REAPER_COVERAGE){
  dir = './lib-cov/';
}
module.exports = require(dir + 'reaper').Reaper;
