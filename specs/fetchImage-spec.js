var proxyquire = require('proxyquire').noCallThru();

describe('Fetch image', function() {

    it('throws an exception on empty data', function() {
        var fetchImage = proxyquire('../lib/fetchImage', {});
        expect(fetchImage()).toThrow(new Error('Required data not set'));
    });

    it('Calls http.get to download the image', function() {
        var fetchImage = proxyquire('../lib/fetchImage', {});
    });
});
