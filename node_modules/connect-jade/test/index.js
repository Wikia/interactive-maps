var Mocha = require('mocha');

var mocha = new Mocha({ timeout: 5000 });
mocha.ui('tdd');

files = [
  'test/jade-test.js'
];

for(var i = 0, _l = files.length; i < _l; i++) {
  mocha.addFile(files[i]);
}

var runner = mocha.run(function(code) {
  process.exit(code);
});