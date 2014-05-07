/* global jasmine */
'use strict';

module.exports = {
	newQStub: function () {
		var defer = jasmine.createSpyObj('defer', ['resolve', 'reject', 'promise']);

		return {
			defer: defer,
			q: {
				defer: function () {
					return defer;
				}
			}
		};
	},

	newCollector: function (methods) {
		return jasmine.createSpyObj('collector', methods);
	}
};
