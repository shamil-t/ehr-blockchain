# ipfs-unixfs <!-- omit in toc -->

[![ipfs.tech](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](https://ipfs.tech)
[![Discuss](https://img.shields.io/discourse/https/discuss.ipfs.tech/posts.svg?style=flat-square)](https://discuss.ipfs.tech)
[![codecov](https://img.shields.io/codecov/c/github/ipfs/js-ipfs-unixfs.svg?style=flat-square)](https://codecov.io/gh/ipfs/js-ipfs-unixfs)
[![CI](https://img.shields.io/github/actions/workflow/status/ipfs/js-ipfs-unixfs/js-test-and-release.yml?branch=master\&style=flat-square)](https://github.com/ipfs/js-ipfs-unixfs/actions/workflows/js-test-and-release.yml?query=branch%3Amaster)

> JavaScript implementation of IPFS' unixfs (a Unix FileSystem representation on top of a MerkleDAG)

## Table of contents <!-- omit in toc -->

- [Install](#install)
  - [Browser `<script>` tag](#browser-script-tag)
- [Spec](#spec)
  - [Use in Node.js](#use-in-nodejs)
  - [Use in a browser with browserify, webpack or any other bundler](#use-in-a-browser-with-browserify-webpack-or-any-other-bundler)
- [Examples](#examples)
  - [Create a file composed by several blocks](#create-a-file-composed-by-several-blocks)
  - [Create a directory that contains several files](#create-a-directory-that-contains-several-files)
  - [UnixFS Data Structure](#unixfs-data-structure)
  - [create an unixfs Data element](#create-an-unixfs-data-element)
  - [add and remove a block size to the block size list](#add-and-remove-a-block-size-to-the-block-size-list)
  - [get total fileSize](#get-total-filesize)
  - [marshal and unmarshal](#marshal-and-unmarshal)
  - [is this UnixFS entry a directory?](#is-this-unixfs-entry-a-directory)
  - [has an mtime been set?](#has-an-mtime-been-set)
- [API Docs](#api-docs)
- [License](#license)
- [Contribute](#contribute)

## Install

```console
$ npm i ipfs-unixfs
```

### Browser `<script>` tag

Loading this module through a script tag will make it's exports available as `IpfsUnixfs` in the global namespace.

```html
<script src="https://unpkg.com/ipfs-unixfs/dist/index.min.js"></script>
```

## Spec

The UnixFS spec can be found inside the [ipfs/specs repository](http://github.com/ipfs/specs)

### Use in Node.js

```JavaScript
import { UnixFS } from 'ipfs-unixfs'
```

### Use in a browser with browserify, webpack or any other bundler

The code published to npm that gets loaded on require is in fact a ES5 transpiled version with the right shims added. This means that you can require it and use with your favourite bundler without having to adjust asset management process.

```JavaScript
import { UnixFS } from 'ipfs-unixfs'
```

## Examples

### Create a file composed by several blocks

```JavaScript
const data = new UnixFS({ type: 'file' })
data.addBlockSize(256) // add the size of each block
data.addBlockSize(256)
// ...
```

### Create a directory that contains several files

Creating a directory that contains several files is achieve by creating a unixfs element that identifies a MerkleDAG node as a directory. The links of that MerkleDAG node are the files that are contained in this directory.

```JavaScript
const data = new UnixFS({ type: 'directory' })
```

### UnixFS Data Structure

```protobuf
syntax = "proto2";

message Data {
  enum DataType {
    Raw = 0;
    Directory = 1;
    File = 2;
    Metadata = 3;
    Symlink = 4;
    HAMTShard = 5;
  }

  required DataType Type = 1;
  optional bytes Data = 2;
  optional uint64 filesize = 3;
  repeated uint64 blocksizes = 4;
  optional uint64 hashType = 5;
  optional uint64 fanout = 6;
  optional uint32 mode = 7;
  optional UnixTime mtime = 8;
}

message UnixTime {
  required int64 Seconds = 1;
  optional fixed32 FractionalNanoseconds = 2;
}

message Metadata {
  optional string MimeType = 1;
}
```

### create an unixfs Data element

```JavaScript
const data = new UnixFS([options])
```

`options` is an optional object argument that might include the following keys:

- type (string, default `file`): The type of UnixFS entry.  Can be:
  - `raw`
  - `directory`
  - `file`
  - `metadata`
  - `symlink`
  - `hamt-sharded-directory`
- data (Uint8Array): The optional data field for this node
- blockSizes (Array, default: `[]`): If this is a `file` node that is made up of multiple blocks, `blockSizes` is a list numbers that represent the size of the file chunks stored in each child node. It is used to calculate the total file size.
- mode (Number, default `0644` for files, `0755` for directories/hamt-sharded-directories) file mode
- mtime (`Date`, `{ secs, nsecs }`, `{ Seconds, FractionalNanoseconds }`, `[ secs, nsecs ]`): The modification time of this node

### add and remove a block size to the block size list

```JavaScript
data.addBlockSize(<size in bytes>)
```

```JavaScript
data.removeBlockSize(<index>)
```

### get total fileSize

```JavaScript
data.fileSize() // => size in bytes
```

### marshal and unmarshal

```javascript
const marshaled = data.marshal()
const unmarshaled = Unixfs.unmarshal(marshaled)
```

### is this UnixFS entry a directory?

```JavaScript
const dir = new Data({ type: 'directory' })
dir.isDirectory() // true

const file = new Data({ type: 'file' })
file.isDirectory() // false
```

### has an mtime been set?

If no modification time has been set, no `mtime` property will be present on the `Data` instance:

```JavaScript
const file = new Data({ type: 'file' })
file.mtime // undefined

Object.prototype.hasOwnProperty.call(file, 'mtime') // false

const dir = new Data({ type: 'dir', mtime: new Date() })
dir.mtime // { secs: Number, nsecs: Number }
```

## API Docs

- <https://ipfs.github.io/js-ipfs-unixfs/modules/ipfs_unixfs.html>

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribute

Contributions welcome! Please check out [the issues](https://github.com/ipfs/js-ipfs-unixfs/issues).

Also see our [contributing document](https://github.com/ipfs/community/blob/master/CONTRIBUTING_JS.md) for more information on how we work, and about contributing in general.

Please be aware that all interactions related to this repo are subject to the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/CONTRIBUTING.md)
