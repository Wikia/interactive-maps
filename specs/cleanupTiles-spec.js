var proxyquire = require('proxyquire').noCallThru(),
	stubs = require('./stubs')

describe('Clean tiles', function() {

    var qStub,
        childProcessMock;


    beforeEach(function() {
		qStub = stubs.newQStub();
        childProcessMock = createSpyObj('child_process', ['exec'])
    });

    it('does not run, if cleanup is disabled by config', function() {
        var cleanupTilesDisabled = proxyquire('../lib/cleanupTiles', {
            q: qStub.q,
            child_process: childProcessMock,
            './config': {
                cleanup: false
            }
        }),
            data = {
                dir: 'fake_dir'
            };
        cleanupTilesDisabled(data);
        expect(childProcessMock.exec).not.toHaveBeenCalled();
        expect(qStub.defer.resolve).toHaveBeenCalledWith(data);
        expect(qStub.defer.resolve.callCount).toEqual(1);
    })

    it('executes rm with correct parameters', function() {
        var cleanupTilesDisabled = proxyquire('../lib/cleanupTiles', {
            q: qStub.q,
            child_process: childProcessMock,
            './config': {
                cleanup: true
            }
        }),
            data = {
                dir: 'fake_dir',
                minZoom: 1,
                maxZoom: 2
            },
            expected = 'rm -rf ' + data.dir + '/{' + data.minZoom + '..' + data.maxZoom + '}';
        cleanupTilesDisabled(data);
        expect(childProcessMock.exec).toHaveBeenCalledWith(expected);
    })


});
