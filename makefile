SHELL := /bin/bash

DIST ?= dist
PUBLIC ?= public

lint:
	npx eslint --fix .
	# npx tsc --noEmit
	@echo -e '\033[1;32mNo lint errors found.'

clean:
	-rm -r ${DIST}

build: clean
	# npx tsc -p .  --emitDeclarationOnly
	# npx tsc-alias
	npx rollup -c rollup.config.js
	cp node_modules/z3-solver/build/z3-built* dist/

web:
	cp public/index.html ${DIST}/web/
	npx rollup -wc rollup.config.js

start: build
	node ${DIST}/index.js

sq:
	node ${DIST}/index.js script.sq

watch:
	npx nodemon --config nodemon.json

test:
	npx jest --coverage --silent

debug:
	node --inspect-brk node_modules/jest/bin/jest.js --coverage --runInBand

.PHONY: lint clean build start test watch debug web sq
