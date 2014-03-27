var proxyquire = require('proxyquire').noCallThru();

describe('Generate tiles', function() {

    it('throws an error on incorrect data', function() {
        var generateTiles = proxyquire('../lib/generateTiles', {});
        expect(generateTiles()).toThrow(new Error('Required data not set'));
    });

    it('executes the tile generating process', function() {
        var defer = createSpyObj('defer', ['resolve', 'reject', 'promise']),
            QStub = {
                defer: function() {
                    return defer
                }
            },
            collector = createSpyObj('collector', ['script', 'args']),
            childProcessStub = {
                spawn: function(script, args) {
                    collector.script(script);
                    collector.args(args);
                    return {
                        stdout: {
                            on: function() {}
                        },
                        on: function() {}
                    };
                }
            },
            generateTiles = proxyquire('../lib/generateTiles', {
                q: QStub,
                child_process: childProcessStub
            }),
            data = {
                minZoom: 0,
                maxZoom: 2,
                image: 'image.jpg',
                dir: 'dir/'
            };
        generateTiles(data);
        expect(collector.script).toHaveBeenCalledWith('gdal2tiles.py');
        expect(collector.args).toHaveBeenCalledWith(
            ['-e', '-p', 'raster', '-z', data.minZoom + '-' + data.maxZoom, '-w', 'none', data.image, data.dir]
        );
    });
});
