# native-fetch

> Returns native fetch/Request/Headers if available or the `undici` module if not

An (almost) drop-in replacement for the `undici` module that returns the native fetch if available or the polyfill if not.

### Why?

Some environments such as the Electron Renderer process straddle the node/browser divide with features from both APIs available.  In these cases the webpack approach of always using the `browser` field in your `package.json` to override requires is too heavy-handed as sometimes you want to use the node version of an API.

Instead we can check for the availability of a given API and return it, rather than the node-polyfill for that API.

### Why Undici and not node-fetch?

[node-fetch](https://www.npmjs.com/package/node-fetch) is the OG fetch implementation for node, but it uses [Node.js streams](https://nodejs.org/api/stream.html) instead of [WHATWG streams](https://streams.spec.whatwg.org/). This means the APIs are not the same which leads to all sorts of weird shenanigans with types.

[undici](https://www.npmjs.com/package/undici) is the new kid on the block and uses WHATWG streams so all of the APIs now live in glorious harmony.

If you are trying to write polymorphic code with strong typing this is a big deal.

## Install

You must install a version of `undici` [alongside this module](https://docs.npmjs.com/files/package.json#peerdependencies) to be used if a native implementation is not available.

```console
$ npm install --save native-fetch undici
```

## Usage

```javascript
const { fetch } = require('native-fetch')

fetch('https://github.com/')
    .then(res => res.text())
    .then(body => console.log(body))
```
