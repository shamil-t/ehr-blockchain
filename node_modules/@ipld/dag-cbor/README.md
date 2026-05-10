# @ipld/dag-cbor <!-- omit in toc -->

[![codecov](https://img.shields.io/codecov/c/github/ipld/js-dag-cbor.svg?style=flat-square)](https://codecov.io/gh/ipld/js-dag-cbor)
[![CI](https://img.shields.io/github/workflow/status/ipld/js-dag-cbor/test%20&%20maybe%20release/master?style=flat-square)](https://github.com/ipld/js-dag-cbor/actions/workflows/js-test-and-release.yml)

> JS implementation of DAG-CBOR

## Table of contents <!-- omit in toc -->

- [Install](#install)
- [Spec](#spec)
- [License](#license)
- [Contribute](#contribute)

## Install

```console
$ npm i @ipld/dag-cbor
```

This is the *new* interface meant for use by itself or with `multiformats` and
`@ipld/block`. It is not used by `js-ipld-format` which is currently
used in IPFS. That library is [here](https://github.com/ipld/js-ipld-dag-cbor).

Usage:

```javascript
import { encode, decode } from '@ipld/dag-cbor'
import { CID } from 'multiformats'

const obj = {
  x: 1,
  /* CID instances are encoded as links */
  y: [2, 3, CID.parse('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4')],
  z: {
    a: CID.parse('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4'),
    b: null,
    c: 'string'
  }
}

let data = encode(obj)
let decoded = decode(data)
decoded.y[0] // 2
CID.asCID(decoded.z.a) // cid instance
```

## Spec

The [`dag-cbor` specification is in the IPLD specs repo](https://github.com/ipld/specs/blob/master/block-layer/codecs/dag-cbor.md).

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribute

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
