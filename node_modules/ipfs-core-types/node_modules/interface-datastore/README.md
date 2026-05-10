# interface-datastore <!-- omit in toc -->

[![ipfs.tech](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](https://ipfs.tech)
[![Discuss](https://img.shields.io/discourse/https/discuss.ipfs.tech/posts.svg?style=flat-square)](https://discuss.ipfs.tech)
[![codecov](https://img.shields.io/codecov/c/github/ipfs/js-ipfs-interfaces.svg?style=flat-square)](https://codecov.io/gh/ipfs/js-ipfs-interfaces)
[![CI](https://img.shields.io/github/actions/workflow/status/ipfs/js-ipfs-interfaces/js-test-and-release.yml?branch=master\&style=flat-square)](https://github.com/ipfs/js-ipfs-interfaces/actions/workflows/js-test-and-release.yml?query=branch%3Amaster)

> datastore interface

## Table of contents <!-- omit in toc -->

- [Install](#install)
  - [Browser `<script>` tag](#browser-script-tag)
- [Implementations](#implementations)
  - [Test suite](#test-suite)
  - [Aborting requests](#aborting-requests)
  - [Concurrency](#concurrency)
  - [Keys](#keys)
- [API](#api)
- [API Docs](#api-docs)
- [License](#license)
- [Contribute](#contribute)

## Install

```console
$ npm i interface-datastore
```

### Browser `<script>` tag

Loading this module through a script tag will make it's exports available as `InterfaceDatastore` in the global namespace.

```html
<script src="https://unpkg.com/interface-datastore/dist/index.min.js"></script>
```

## Implementations

- Backed Implementations
  - Memory: [`datastore-core/memory`](https://github.com/ipfs/js-datastore-core/tree/master/src/memory.js)
  - level: [`datastore-level`](https://github.com/ipfs/js-datastore-level) (supports any levelup compatible backend)
  - File System: [`datstore-fs`](https://github.com/ipfs/js-datastore-fs)
  - S3: [`datstore-s3`](https://github.com/ipfs/js-datastore-s3)
- Wrapper Implementations
  - Mount: [`datastore-core/src/mount`](https://github.com/ipfs/js-datastore-core/tree/master/src/mount.js)
  - Keytransform: [`datstore-core/src/keytransform`](https://github.com/ipfs/js-datastore-core/tree/master/src/keytransform.js)
  - Sharding: [`datastore-core/src/sharding`](https://github.com/ipfs/js-datastore-core/tree/master/src/sharding.js)
  - Tiered: [`datstore-core/src/tiered`](https://github.com/ipfs/js-datastore-core/blob/master/src/tiered.js)
  - Namespace: [`datastore-core/src/namespace`](https://github.com/ipfs/js-datastore-core/tree/master/src/namespace.js)

If you want the same functionality as [go-ds-flatfs](https://github.com/ipfs/go-ds-flatfs), use sharding with fs.

```js
import FsStore from 'datastore-fs'
import { ShardingDataStore, shard } from 'datastore-core'

const fs = new FsStore('path/to/store')

// flatfs now works like go-flatfs
const flatfs = await ShardingStore.createOrOpen(fs, new shard.NextToLast(2))
```

### Test suite

Available via the [`interface-datastore-tests`](https://npmjs.com/package/interface-datastore-tests) module

```js
import { interfaceDatastoreTests } from 'interface-datastore-tests'

describe('mystore', () => {
  interfaceDatastoreTests({
    async setup () {
      return instanceOfMyStore
    },
    async teardown () {
      // cleanup resources
    }
  })
})
```

### Aborting requests

Most API methods accept an \[AbortSignal]\[] as part of an options object.  Implementations may listen for an `abort` event emitted by this object, or test the `signal.aborted` property. When received implementations should tear down any long-lived requests or resources created.

### Concurrency

The streaming `(put|get|delete)Many` methods are intended to be used with modules such as [it-parallel-batch](https://www.npmjs.com/package/it-parallel-batch) to allow calling code to control levels of parallelisation.  The batching method ensures results are returned in the correct order, but interface implementations should be thread safe.

```js
import batch from 'it-parallel-batch'
const source = [{
  key: ..,
  value: ..
}]

// put values into the datastore concurrently, max 10 at a time
for await (const { key, data } of batch(store.putMany(source), 10)) {
  console.info(`Put ${key}`)
}
```

### Keys

To allow a better abstraction on how to address values, there is a `Key` class which is used as identifier. It's easy to create a key from a `Uint8Array` or a `string`.

```js
const a = new Key('a')
const b = new Key(new Uint8Array([0, 1, 2, 3]))
```

The key scheme is inspired by file systems and Google App Engine key model. Keys are meant to be unique across a system. They are typically hierarchical, incorporating more and more specific namespaces. Thus keys can be deemed 'children' or 'ancestors' of other keys:

- `new Key('/Comedy')`
- `new Key('/Comedy/MontyPython')`

Also, every namespace can be parameterized to embed relevant object information. For example, the Key `name` (most specific namespace) could include the object type:

- `new Key('/Comedy/MontyPython/Actor:JohnCleese')`
- `new Key('/Comedy/MontyPython/Sketch:CheeseShop')`
- `new Key('/Comedy/MontyPython/Sketch:CheeseShop/Character:Mousebender')`

## API

<https://ipfs.github.io/interface-datastore/>

## API Docs

- <https://ipfs.github.io/js-ipfs-interfaces/modules/interface_datastore.html>

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribute

Contributions welcome! Please check out [the issues](https://github.com/ipfs/js-ipfs-interfaces/issues).

Also see our [contributing document](https://github.com/ipfs/community/blob/master/CONTRIBUTING_JS.md) for more information on how we work, and about contributing in general.

Please be aware that all interactions related to this repo are subject to the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/CONTRIBUTING.md)

[Key]: #Keys

[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object

[Uint8Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array

[AbortSignal]: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal

[AsyncIterator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator

[AsyncIterable]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols

[String]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String

[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array

[Function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function

[Number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number

[Boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
