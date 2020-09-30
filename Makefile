.PHONY: wasm all important clean

all: build

.PHONY: bintohex cleanhex

cleanhex:
	rm -rf t05_0.fbl t05_1.fbl 0.txt 1.txt

bintohex:
	hexdump t05_0.fbl > 0.txt
	hexdump t05_1.fbl > 1.txt


.PHONY: all build watch dev start test pretest lint jestc copydist cleandist
.PHONY: test

build:
	npm run build

test: jestc
	npm run test

jestc:
	npm run jestc

# jest watch tests
jestw:
	npm run jestw

copydist:
	npm run copydist


cleandist:
	npm run cleandist


clean:
	rm -rf out/*
	rm -rf dist/*

