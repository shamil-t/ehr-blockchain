# ipfs-utils <!-- omit in toc -->

[![ipfs.tech](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](https://ipfs.tech)
[![Discuss](https://img.shields.io/discourse/https/discuss.ipfs.tech/posts.svg?style=flat-square)](https://discuss.ipfs.tech)
[![codecov](https://img.shields.io/codecov/c/github/ipfs/js-ipfs-utils.svg?style=flat-square)](https://codecov.io/gh/ipfs/js-ipfs-utils)
[![CI](https://img.shields.io/github/actions/workflow/status/ipfs/js-ipfs-utils/js-test-and-release.yml?branch=master\&style=flat-square)](https://github.com/ipfs/js-ipfs-utils/actions/workflows/js-test-and-release.yml?query=branch%3Amaster)

> Package to aggregate shared logic and dependencies for the IPFS ecosystem

## Table of contents <!-- omit in toc -->

- [Install](#install)
  - [Browser `<script>` tag](#browser-script-tag)
- [Usage](#usage)
- [API Docs](#api-docs)
- [License](#license)
- [Contribute](#contribute)

## Install

```console
$ npm i ipfs-utils
```

### Browser `<script>` tag

Loading this module through a script tag will make it's exports available as `IpfsUtils` in the global namespace.

```html
<script src="https://unpkg.com/ipfs-utils/dist/index.min.js"></script>
```

`ipfs-utils` aims to provide single function default export per file (with a few exceptions) scoped in 3 general categories:

- General use
- Data structs wrangling (arrays, objects, streams, etc)
- IPFS core subsystems

*General use* and *Data structs wrangling* should try to be just re-exports of community packages.

The IPFS ecosystem has lots of repos with it comes several problems like:

- Domain logic dedupe - all interface-core implementations shared a lot of logic like validation, streams handling, etc.
- Dependencies management - it's really easy with so many repos for dependencies to go out of control, they become outdated, different repos use different modules to do the same thing (like merging defaults options), browser bundles ends up with multiple versions of the same package, bumping versions is cumbersome to do because we need to go through several repos, etc.

These problems are the motivation for this package, having shared logic in this package avoids creating cyclic dependencies, centralizes common use modules/functions (exactly like aegir does for the tooling), semantic versioning for 3rd party dependencies is handled in one single place (a good example is going from streams 2 to 3) and maintainers should only care about having `ipfs-utils` updated.

## Usage

Each function should be imported directly.

```js
const validateAddInput = require('ipfs-utils/src/files/add-input-validation')

validateAddInput(Buffer.from('test'))
// true
```

## API Docs

- <https://ipfs.github.io/js-ipfs-utils>

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribute

Contributions welcome! Please check out [the issues](https://github.com/ipfs/js-ipfs-utils/issues).

Also see our [contributing document](https://github.com/ipfs/community/blob/master/CONTRIBUTING_JS.md) for more information on how we work, and about contributing in general.

Please be aware that all interactions related to this repo are subject to the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/CONTRIBUTING.md)
