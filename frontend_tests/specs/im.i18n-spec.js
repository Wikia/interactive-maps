'use strict';

describe('im.i18n', function () {
	var config = {
			messages: {
				'test-message-key': 'Lorem ipsum dolor'
			}
		},
		i18n = modules['im.i18n'](config),
		key = 'test-message-key';

	it('returns message of given key', function () {
		expect(i18n.msg(key)).toBe(config.messages[key]);
	});

	it('returns key if no message of given key found', function () {
		delete config.messages[key];

		expect(i18n.msg(key)).toBe(key);
	});
});
