REPORTER = dot
test:
	@NODE_ENV=test ./node_modules/.bin/mocha -b --reporter $(REPORTER)

lib-cov:
	./node_modules/jscoverage/bin/jscoverage lib lib-cov

test-cov:	lib-cov
	@ONEONE_COVERAGE=1 $(MAKE) test REPORTER=html-cov 1> coverage.html
	rm -rf lib-cov

test-coveralls:	lib-cov
	echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@ONEONE_COVERAGE=1 $(MAKE) test REPORTER=mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js
	rm -rf lib-cov

.PHONY: test
