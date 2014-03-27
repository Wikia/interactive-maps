var proxyquire = require('proxyquire').noCallThru(),
    stubs = require('./stubs')


    describe('Upload Tiles', function() {

        it('Throws error when called with incorrect data', function() {
            var uploadTiles = proxyquire('../lib/uploadTiles', {
                config: {}
            });
            expect(uploadTiles()).toThrow(new Error('Required data not set'));
        });

        it('Calls dfs sendFiles', function() {
            var qStub = stubs.newQStub(),
                collector = stubs.newCollector(['bucketName', 'dir', 'filePaths']),
                dfsStub = {
                    sendFiles: function(bucketName, dir, filePaths) {
                        collector.bucketName(bucketName);
                        collector.dir(dir);
                        collector.filePaths(filePaths);
                        return {
                            then: function(cb) {
                                cb()
                            }
                        }
                    }
                },
                uploadTiles = proxyquire('../lib/uploadTiles', {
                    q: qStub.q,
                    './dfs': dfsStub,
                    './config': {
                        minZoom: 0,
                        bucketPrefix: 'bucketPrefix'
                    }
                }),
                data = {
                    name: 'name with spaces',
                    dir: 'dir',
                    minZoom: 0,
                    maxZoom: 3
                },
                expected = {
                    bucketName: 'bucketPrefixname_with_spaces',
                    dir: 'dir',
                    filePaths: '{0..3}/*/*.png'
                }
            uploadTiles(data);
            expect(qStub.defer.resolve.callCount).toEqual(1);
            expect(collector.bucketName).toHaveBeenCalledWith(expected.bucketName)
            expect(collector.dir).toHaveBeenCalledWith(expected.dir)
            expect(collector.filePaths).toHaveBeenCalledWith(expected.filePaths)
        });

    })
