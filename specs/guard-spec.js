'use strict';

var proxyquire = require('proxyquire').noCallThru(),
    guard = proxyquire('../lib/guard', {
        './config': {
            api: {
                token: 'token'
            }
        }
    }),
    stubReq = function(method, token) {
        return {
            method: method,
            get: function() {
                return token;
            }
        };
    },
    stubRes = function() {
        return {};
    },
    errObj = function() {
        return {
            status: 401,
            message: 'Unauthorized'
        };
    };


describe('Guard module', function() {
    it('should allow all GET requests', function() {
        guard(
            stubReq('GET'),
            stubRes(),
            function(err) {
                expect(err).not.toBeDefined();
            }
        );

        guard(
            stubReq('GET', 'token'),
            stubRes(),
            function(err) {
                expect(err).not.toBeDefined();
            }
        );
    });

    it('should allow requests with correct token', function() {
        guard(
            stubReq('POST', 'token'),
            stubRes(),
            function(err) {
                expect(err).not.toBeDefined();
            }
        );

        guard(
            stubReq('PUT', 'token'),
            stubRes(),
            function(err) {
                expect(err).not.toBeDefined();
            }
        );

        guard(
            stubReq('HEAD', 'token'),
            stubRes(),
            function(err) {
                expect(err).not.toBeDefined();
            }
        );
    });

    it('should not allow requests with wrong token', function() {
        guard(
            stubReq('POST', 'wrong token'),
            stubRes(),
            function(err) {
                expect(err).toBeDefined();
                expect(err).toEqual(errObj());
            }
        );

        guard(
            stubReq('PUT', 'wrong token'),
            stubRes(),
            function(err) {
                expect(err).toBeDefined();
                expect(err).toEqual(errObj());
            }
        );

        guard(
            stubReq('HEAD', 'wrong token'),
            stubRes(),
            function(err) {
                expect(err).toBeDefined();
                expect(err).toEqual(errObj());
            }
        );
    });

    it('should not allow requests without token', function() {
        guard(
            stubReq('POST'),
            stubRes(),
            function(err) {
                expect(err).toBeDefined();
                expect(err).toEqual(errObj());
            }
        );

        guard(
            stubReq('PUT'),
            stubRes(),
            function(err) {
                expect(err).toBeDefined();
                expect(err).toEqual(errObj());
            }
        );

        guard(
            stubReq('HEAD'),
            stubRes(),
            function(err) {
                expect(err).toBeDefined();
                expect(err).toEqual(errObj());
            }
        );
    });
});
