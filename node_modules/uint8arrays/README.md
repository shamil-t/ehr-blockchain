[![codecov](https://img.shields.io/codecov/c/github/achingbrain/uint8arrays.svg?style=flat-square)](https://codecov.io/gh/achingbrain/uint8arrays)
[![CI](https://img.shields.io/github/actions/workflow/status/achingbrain/uint8arrays/js-test-and-release.yml?branch=main\&style=flat-square)](https://github.com/achingbrain/uint8arrays/actions/workflows/js-test-and-release.yml?query=branch%3Amain)

> Utility functions to make dealing with Uint8Arrays easier

# About

`Uint8Array`s bring memory-efficient(ish) byte handling to browsers - they are similar to Node.js `Buffer`s but lack a lot of the utility methods present on that class.

This module exports a number of function that let you do common operations - joining Uint8Arrays together, seeing if they have the same contents etc.

Since Node.js `Buffer`s are also `Uint8Array`s, it falls back to `Buffer` internally where it makes sense for performance reasons.

## alloc(size)

Create a new `Uint8Array`. If `globalThis.Buffer` is defined, it will be used in preference to `globalThis.Uint8Array`.

### Example

```js
import { alloc } from 'uint8arrays/alloc'

const buf = alloc(100)
```

## allocUnsafe(size)

Create a new `Uint8Array`. If `globalThis.Buffer` is defined, it will be used in preference to `globalThis.Uint8Array`.

On platforms that support it, memory referenced by the returned `Uint8Array` will not be initialized.

### Example

```js
import { allocUnsafe } from 'uint8arrays/alloc'

const buf = allocUnsafe(100)
```

## compare(a, b)

Compare two `Uint8Arrays`

### Example

```js
import { compare } from 'uint8arrays/compare'

const arrays = [
  Uint8Array.from([3, 4, 5]),
  Uint8Array.from([0, 1, 2])
]

const sorted = arrays.sort(compare)

console.info(sorted)
// [
//    Uint8Array[0, 1, 2]
//    Uint8Array[3, 4, 5]
// ]
```

## concat(arrays, \[length])

Concatenate one or more `Uint8Array`s and return a `Uint8Array` with their contents.

If you know the length of the arrays, pass it as a second parameter, otherwise it will be calculated by traversing the list of arrays.

### Example

```js
import { concat } from 'uint8arrays/concat'

const arrays = [
  Uint8Array.from([0, 1, 2]),
  Uint8Array.from([3, 4, 5])
]

const all = concat(arrays, 6)

console.info(all)
// Uint8Array[0, 1, 2, 3, 4, 5]
```

## equals(a, b)

Returns true if the two arrays are the same array or if they have the same length and contents.

### Example

```js
import { equals } from 'uint8arrays/equals'

const a = Uint8Array.from([0, 1, 2])
const b = Uint8Array.from([3, 4, 5])
const c = Uint8Array.from([0, 1, 2])

console.info(equals(a, b)) // false
console.info(equals(a, c)) // true
console.info(equals(a, a)) // true
```

## fromString(string, encoding = 'utf8')

Returns a new `Uint8Array` created from the passed string and interpreted as the passed encoding.

Supports `utf8` and any of the [multibase encodings](https://github.com/multiformats/multibase/blob/master/multibase.csv) as implemented by the [multiformats module](https://www.npmjs.com/package/multiformats).

### Example

```js
import { fromString } from 'uint8arrays/from-string'

console.info(fromString('hello world')) // Uint8Array[104, 101 ...
console.info(fromString('00010203aabbcc', 'base16')) // Uint8Array[0, 1 ...
console.info(fromString('AAECA6q7zA', 'base64')) // Uint8Array[0, 1 ...
console.info(fromString('01234', 'ascii')) // Uint8Array[48, 49 ...
```

## toString(array, encoding = 'utf8')

Returns a string created from the passed `Uint8Array` in the passed encoding.

Supports `utf8` and any of the [multibase encodings](https://github.com/multiformats/multibase/blob/master/multibase.csv) as implemented by the [multiformats module](https://www.npmjs.com/package/multiformats).

### Example

```js
import { toString } from 'uint8arrays/to-string'

console.info(toString(Uint8Array.from([104, 101...]))) // 'hello world'
console.info(toString(Uint8Array.from([0, 1, 2...]), 'base16')) // '00010203aabbcc'
console.info(toString(Uint8Array.from([0, 1, 2...]), 'base64')) // 'AAECA6q7zA'
console.info(toString(Uint8Array.from([48, 49, 50...]), 'ascii')) // '01234'
```

## xor(a, b)

Returns a `Uint8Array` containing `a` and `b` xored together.

### Example

```js
import { xor } from 'uint8arrays/xor'

console.info(xor(Uint8Array.from([1, 0]), Uint8Array.from([0, 1]))) // Uint8Array[1, 1]
```

# Install

```console
$ npm i uint8arrays
```

## Browser `<script>` tag

Loading this module through a script tag will make it's exports available as `Uint8arrays` in the global namespace.

```html
<script src="https://unpkg.com/uint8arrays/dist/index.min.js"></script>
```

# API Docs

- <https://achingbrain.github.io/uint8arrays>

# License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

# Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
