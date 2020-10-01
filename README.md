[![Build Status](https://travis-ci.com/esromneb/behavior-tree-zmq.svg?branch=master)](https://travis-ci.com/esromneb/behavior-tree-zmq) [![npm version](https://badge.fury.io/js/behavior-tree-zmq.svg)](https://badge.fury.io/js/behavior-tree-zmq)
# behavior-tree-zmq
A wrapper for zmq for the specific usage of writing data to [Groot](https://github.com/BehaviorTree/Groot).

# Dependencies
* zmq

# Details
This class has a member `dataCallback` which is meant to be passed to / called by `AsyncBehaviorTree`.

## dataCallback
Two arguments, a buffer and a flushList.
* The first call to this function must have only the first buffer, and no 2nd argument
  * This first call is the full header
* The second call can have either the buffer, or the buffer and flushList
* The buffer is always data output from `AsyncBehaviorTree`


# Publish notes to myself
* Publish with:
```bash
nvm use 14
make wasm build
npm publish
```
