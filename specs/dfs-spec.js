var proxyquire = require('proxyquire').noCallThru(),
    stubs = require('./stubs');

describe('DFS', function() {

    it('Throws error on wrong params', function() {
        var dfs = proxyquire('../lib/dfs', {});
        expect(dfs.sendFiles()).toThrow(new Error('Required data not set'));
    })

    it('Uploads files', function() {
        var dfs = proxyquire('../lib/dfs', {
            './config': {
                swift: {
                    host: '',
                    authPath: '',
                    user: '',
                    key: ''
                }
            }
        }),
            data = {
                bucket: '',
                dir: '',
                filePaths: ''
            }
        dfs.sendFiles(data.bucket, data.dir, data.filePaths);
    })

});
