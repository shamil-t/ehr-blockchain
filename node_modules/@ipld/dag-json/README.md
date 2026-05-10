# @ipld/dag-json <!-- omit in toc -->

[![codecov](https://img.shields.io/codecov/c/github/ipld/js-dag-json.svg?style=flat-square)](https://codecov.io/gh/ipld/js-dag-json)
[![CI](https://img.shields.io/github/workflow/status/ipld/js-dag-json/test%20&%20maybe%20release/master?style=flat-square)](https://github.com/ipld/js-dag-json/actions/workflows/js-test-and-release.yml)

> JS implementation of DAG-JSON

## Table of contents <!-- omit in toc -->

- [Install](#install)
- [Example](#example)
- [Usage](#usage)
- [License](#license)
- [Contribute](#contribute)

## Install

```console
$ npm i @ipld/dag-json
```

## Example

```javascript
import { encode, decode } from '@ipld/dag-json'
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

## Usage

`@ipld/dag-json` is designed to be used within multiformats but can be used separately. `encode()`, `decode()` are available as exports, as are `name` and `code` to match with the corresponding DAG-JSON [multicodec](https://github.com/multiformats/multicodec/).

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribute

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
