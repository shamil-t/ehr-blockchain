# it-pushable <!-- omit in toc -->

[![codecov](https://img.shields.io/codecov/c/github/alanshaw/it-pushable.svg?style=flat-square)](https://codecov.io/gh/alanshaw/it-pushable)
[![CI](https://img.shields.io/github/actions/workflow/status/alanshaw/it-pushable/js-test-and-release.yml?branch=master\&style=flat-square)](https://github.com/alanshaw/it-pushable/actions/workflows/js-test-and-release.yml?query=branch%3Amaster)

> An iterable that you can push values into

# About

An iterable that you can push values into.

## Example

```js
import { pushable } from 'it-pushable'

const source = pushable()

setTimeout(() => source.push('hello'), 100)
setTimeout(() => source.push('world'), 200)
setTimeout(() => source.end(), 300)

const start = Date.now()

for await (const value of source) {
  console.log(`got "${value}" after ${Date.now() - start}ms`)
}
console.log(`done after ${Date.now() - start}ms`)

// Output:
// got "hello" after 105ms
// got "world" after 207ms
// done after 309ms
```

## Example

```js
import { pushableV } from 'it-pushable'
import all from 'it-all'

const source = pushableV()

source.push(1)
source.push(2)
source.push(3)
source.end()

console.info(await all(source))

// Output:
// [ [1, 2, 3] ]
```

## Table of contents <!-- omit in toc -->

- [Install](#install)
  - [Browser `<script>` tag](#browser-script-tag)
- [Usage](#usage)
- [Related](#related)
- [API Docs](#api-docs)
- [License](#license)
- [Contribution](#contribution)

## Install

```console
$ npm i it-pushable
```

### Browser `<script>` tag

Loading this module through a script tag will make it's exports available as `ItPushable` in the global namespace.

```html
<script src="https://unpkg.com/it-pushable/dist/index.min.js"></script>
```

## Usage

```js
import { pushable } from 'it-pushable'

const source = pushable()

setTimeout(() => source.push('hello'), 100)
setTimeout(() => source.push('world'), 200)
setTimeout(() => source.end(), 300)

const start = Date.now()

for await (const value of source) {
  console.log(`got "${value}" after ${Date.now() - start}ms`)
}
console.log(`done after ${Date.now() - start}ms`)

/*
Output:
got "hello" after 105ms
got "world" after 207ms
done after 309ms
*/
```

```js
import { pushableV } from 'it-pushable'
import all from 'it-all'

const source = pushableV()

source.push(1)
source.push(2)
source.push(3)
source.end()

console.info(await all(source))
/*
Output:
[ [1, 2, 3] ]
*/
```

## Related

- [`it-pipe`](https://www.npmjs.com/package/it-pipe) Utility to "pipe" async iterables together

## API Docs

- <https://alanshaw.github.io/it-pushable>

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
