var proxyquire = require('proxyquire').noCallThru(),
    stubs = require('./stubs');

describe('Fetch image', function() {

    it('throws an exception on empty data', function() {
        var fetchImage = proxyquire('../lib/fetchImage', {});
        expect(fetchImage()).toThrow(new Error('Required data not set'));
    });

    it('calls http.get to download the image', function() {
        var res = createSpyObj('res', ['on']),
            http = {
                get: function(x, cb) {
                    cb({
                        on: function() {
                            return res;
                        }
                    });
                    return {
                        on: function() {}
                    }
                }
            },
            qStub = stubs.newQStub(),
            fsStub = createSpyObj('fs', ['createWriteStream']),
            fetchImage = proxyquire('../lib/fetchImage', {
                http: http,
                url: require('url'),
                fs: fsStub,
                path: {},
                q: qStub.q
            }),
            data = {
                fileUrl: 'http:/example.com/image.jpg'
            };
        fetchImage(data);
        expect(res.on).toHaveBeenCalled();
        expect(fsStub.createWriteStream).toHaveBeenCalled();
    });
});
