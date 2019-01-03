
SRC = lib/lunr.ts \
	lib/utils.ts \
	lib/field_ref.ts \
	lib/set.ts \
	lib/idf.ts \
	lib/token.ts \
	lib/tokenizer.ts \
	lib/pipeline.ts \
	lib/vector.ts \
	lib/stemmer.ts \
	lib/stop_word_filter.ts \
	lib/trimmer.ts \
	lib/token_set.ts \
	lib/token_set_builder.ts \
	lib/number_map.ts \
	lib/number_map_builder.ts \
	lib/index.ts \
	lib/builder.ts \
	lib/match_data.ts \
	lib/query.ts \
	lib/query_parse_error.ts \
	lib/query_lexer.ts \
	lib/query_parser.ts \

PROJ = src/tsconfig.bundle.json

PROJ_SRC = $(SRC) \
	tsconfig.json \
	build/tsconfig.pre.json \
	build/tsconfig.post.json \
	build/tsconfig.bundle.json \
	build/wrapper_start.js \
	build/wrapper_start.d.ts \
	build/wrapper_end.js \
	build/wrapper_end.d.ts \

DOC_SRC = obj/docs/lunr.js \
	obj/docs/utils.js \
	obj/docs/field_ref.js \
	obj/docs/set.js \
	obj/docs/idf.js \
	obj/docs/token.js \
	obj/docs/tokenizer.js \
	obj/docs/pipeline.js \
	obj/docs/vector.js \
	obj/docs/stemmer.js \
	obj/docs/stop_word_filter.js \
	obj/docs/trimmer.js \
	obj/docs/token_set.js \
	obj/docs/token_set_builder.js \
	obj/docs/number_map.js \
	obj/docs/number_map_builder.js \
	obj/docs/index.js \
	obj/docs/builder.js \
	obj/docs/match_data.js \
	obj/docs/query.js \
	obj/docs/query_parse_error.js \
	obj/docs/query_lexer.js \
	obj/docs/query_parser.js \

YEAR = $(shell date +%Y)
VERSION = $(shell cat VERSION)

NODE ?= $(shell which node)
NPM ?= $(shell which npm)
UGLIFYJS ?= ./node_modules/.bin/uglifyjs
MOCHA ?= ./node_modules/.bin/mocha
MUSTACHE ?= ./node_modules/.bin/mustache
ESLINT ?= ./node_modules/.bin/eslint
JSDOC ?= ./node_modules/.bin/jsdoc
NODE_STATIC ?= ./node_modules/.bin/static
TSC ?= ./node_modules/.bin/tsc

all: test lint docs
release: lunr.js lunr.min.js bower.json package.json component.json docs

tsc: $(PROJ_SRC)
	${TSC} -b build/tsconfig.bundle.json

tsc/docs: $(PROJ_SRC)
	${TSC} -b build/tsconfig.docs.json

lunr.d.ts: tsc
	cat obj/lunr.d.ts | \
	sed "s/@YEAR/${YEAR}/" | \
	sed "s/@VERSION/${VERSION}/" > $@

lunr.js.map: tsc
	cat obj/lunr.js.map | \
	sed "s/\"..\/src/\".\/src/" > $@

lunr.js: tsc lunr.d.ts lunr.js.map
	cat obj/lunr.js | \
	sed "s/@YEAR/${YEAR}/" | \
	sed "s/@VERSION/${VERSION}/" > $@

lunr.min.js: lunr.js
	${UGLIFYJS} --compress --mangle --comments < $< > $@

%.json: build/%.json.template
	cat $< | sed "s/@VERSION/${VERSION}/" > $@

size: lunr.min.js
	@gzip -c lunr.min.js | wc -c

server: test/index.html
	${NODE_STATIC} -a 0.0.0.0 -H '{"Cache-Control": "no-cache, must-revalidate"}'

lint: $(SRC)
	${ESLINT} $^

lint/fix: $(SRC)
	${ESLINT} $^ --fix

perf/*_perf.js:
	${NODE} -r ./perf/perf_helper.js $@

benchmark: perf/*_perf.js

test: node_modules lunr.js
	${MOCHA} test/*.js -u tdd -r test/test_helper.js -R dot -C

test/inspect: node_modules lunr.js
	${MOCHA} test/*.js -u tdd -r test/test_helper.js -R dot -C --inspect-brk=0.0.0.0:9292

test/env/file_list.json: $(wildcard test/*test.js)
	${NODE} -p 'JSON.stringify({test_files: process.argv.slice(1)})' $^ > $@

test/index.html: test/env/file_list.json test/env/index.mustache
	${MUSTACHE} $^ > $@

docs: tsc/docs
	${JSDOC} -R README.md -d docs -c build/jsdoc.conf.json $(DOC_SRC)

clean:
	rm -f lunr{.min,}{.js,.js.map,.d.ts}
	rm -rf docs
	rm -rf obj
	rm *.json

reset:
	git checkout lunr.* *.json

node_modules: package.json
	${NPM} -s install

.PHONY: test clean docs reset perf/*_perf.js test/inspect
