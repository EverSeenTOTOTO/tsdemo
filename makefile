SHELL := /bin/bash

DIST ?= dist

lint:
	npx eslint --fix .
	npx tsc --noEmit
	@echo -e '\033[1;32mNo lint errors found.'

clean:
	-rm -r ${DIST}

build: clean
	npx tsc -p .  --emitDeclarationOnly
	npx tsc-alias
	npx rollup -c rollup.config.js

start: build
	node ${DIST}/index.js

watch:
	npx nodemon --config nodemon.json

test:
	npx jest --coverage --silent

.PHONY: lint clean build start test watch
