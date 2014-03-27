module.exports = {
	newQStub: function() {
		var defer = createSpyObj('defer', ['resolve', 'reject', 'promise']);
		return {
			defer: defer,
			q: {
				defer: function() {
					return defer
				}
			}
		}
	},

	newCollector: function (methods) {
		return createSpyObj('collector', methods);
	}
}