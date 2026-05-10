# uint8-varint <!-- omit in toc -->

[![codecov](https://img.shields.io/codecov/c/github/achingbrain/uint8-varint.svg?style=flat-square)](https://codecov.io/gh/achingbrain/uint8-varint)
[![CI](https://img.shields.io/github/actions/workflow/status/achingbrain/uint8-varint/js-test-and-release.yml?branch=master\&style=flat-square)](https://github.com/achingbrain/uint8-varint/actions/workflows/js-test-and-release.yml?query=branch%3Amaster)

> Read/write unsigned varints from Uint8Arrays and Uint8ArrayLists

## Table of contents <!-- omit in toc -->

- [Install](#install)
  - [Browser `<script>` tag](#browser-script-tag)
- [Usage](#usage)
- [API Docs](#api-docs)
- [License](#license)
- [Contribution](#contribution)

## Install

```console
$ npm i uint8-varint
```

### Browser `<script>` tag

Loading this module through a script tag will make it's exports available as `Uint8Varint` in the global namespace.

```html
<script src="https://unpkg.com/uint8-varint/dist/index.min.js"></script>
```

## Usage

```js
import { Uint8ArrayList } from 'uint8arraylist'
import * as varint from 'uint8-varint'

const value = 12345

const buf = new Uint8ArrayList(
  new Uint8Array(2)
)
varint.encode(value, buf)

varint.decode(buf) // 12345
```

## API Docs

- <https://achingbrain.github.io/uint8-varint>

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
