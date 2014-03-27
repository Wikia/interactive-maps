var proxyquire = require('proxyquire').noCallThru();

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
            defer = createSpyObj('defer', ['resolve', 'reject', 'promise']),
            fsStub = createSpyObj('fs', ['createWriteStream']),
            QStub = {
                defer: function() {
                    return defer
                }
            },
            fetchImage = proxyquire('../lib/fetchImage', {
                http: http,
                url: require('url'),
                fs: fsStub,
                path: {},
                q: QStub
            }),
            data = {
                fileUrl: 'http:/example.com/image.jpg'
            };
        fetchImage(data);
        expect(res.on).toHaveBeenCalled();
        expect(fsStub.createWriteStream).toHaveBeenCalled();
    });
});
