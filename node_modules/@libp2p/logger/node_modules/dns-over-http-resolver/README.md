# dns-over-http-resolver <!-- omit in toc -->

[![codecov](https://img.shields.io/codecov/c/github/vasco-santos/dns-over-http-resolver.svg?style=flat-square)](https://codecov.io/gh/vasco-santos/dns-over-http-resolver)
[![CI](https://img.shields.io/github/actions/workflow/status/vasco-santos/dns-over-http-resolver/js-test-and-release.yml?branch=main\&style=flat-square)](https://github.com/vasco-santos/dns-over-http-resolver/actions/workflows/js-test-and-release.yml?query=branch%3Amain)

> DNS over HTTP resolver

## Table of contents <!-- omit in toc -->

- [Install](#install)
  - [Browser `<script>` tag](#browser-script-tag)
- [Usage](#usage)
  - [options](#options)
- [API](#api)
  - [resolve(hostname, rrType)](#resolvehostname-rrtype)
    - [Parameters](#parameters)
    - [Returns](#returns)
    - [Example](#example)
  - [resolve4(hostname)](#resolve4hostname)
    - [Parameters](#parameters-1)
    - [Returns](#returns-1)
    - [Example](#example-1)
  - [resolve6(hostname)](#resolve6hostname)
    - [Parameters](#parameters-2)
    - [Returns](#returns-2)
    - [Example](#example-2)
  - [resolveTxt(hostname)](#resolvetxthostname)
    - [Parameters](#parameters-3)
    - [Returns](#returns-3)
    - [Example](#example-3)
  - [getServers()](#getservers)
    - [Returns](#returns-4)
    - [Example](#example-4)
  - [setServers(servers)](#setserversservers)
    - [Parameters](#parameters-4)
    - [Example](#example-5)
- [Contribute](#contribute)
- [API Docs](#api-docs)
- [License](#license)
- [Contribution](#contribution)

## Install

```console
$ npm i dns-over-http-resolver
```

### Browser `<script>` tag

Loading this module through a script tag will make it's exports available as `DnsOverHttpResolver` in the global namespace.

```html
<script src="https://unpkg.com/dns-over-http-resolver/dist/index.min.js"></script>
```

Isomorphic DNS over HTTP resolver using fetch.

API based on [Node.js' dns promises API](https://nodejs.org/dist/latest-v14.x/docs/api/dns.html#dns_dns_promises_api), allowing the native `dns` module to be used if available when relying on this API.

## Usage

```js
const DnsOverHttpResolver = require('dns-over-http-resolver')

const dohResolver = new DnsOverHttpResolver(options)
```

[Cloudflare](https://cloudflare-dns.com/dns-query) and [Google](https://dns.google/resolve) DNS servers are used by default. They can be replaced via the API.

You can also use `require('dns').promises` in Node.js in lieu of this module.

### options

You can provide the following options for the DnsOverHttpResolver:

| Name     | Type     | Description                          | Default |
| -------- | -------- | ------------------------------------ | ------- |
| maxCache | `number` | maximum number of cached dns records | 100     |

## API

### resolve(hostname, rrType)

Uses the DNS protocol to resolve the given host name into a DNS record.

#### Parameters

| Name      | Type     | Description                         |
| --------- | -------- | ----------------------------------- |
| hostname  | `string` | host name to resolve                |
| \[rrType] | `string` | resource record type (default: 'A') |

#### Returns

| Type                     | Description                                                    |
| ------------------------ | -------------------------------------------------------------- |
| `Promise<Array<string>>` | returns a Promise resolving a DNS record according to its type |

#### Example

```js
const DnsOverHttpResolver = require('dns-over-http-resolver')
const resolver = new DnsOverHttpResolver()

const hostname = 'google.com'
const recordType = 'TXT'

const dnsRecord = await resolver.resolve(hostname, recordType)
```

### resolve4(hostname)

Uses the DNS protocol to resolve the given host name into IPv4 addresses.

#### Parameters

| Name     | Type     | Description          |
| -------- | -------- | -------------------- |
| hostname | `string` | host name to resolve |

#### Returns

| Type                     | Description                                |
| ------------------------ | ------------------------------------------ |
| `Promise<Array<string>>` | returns a Promise resolving IPv4 addresses |

#### Example

```js
const DnsOverHttpResolver = require('dns-over-http-resolver')
const resolver = new DnsOverHttpResolver()

const hostname = 'google.com'

const address = await resolver.resolve4(hostname) // ['216.58.212.142']
```

### resolve6(hostname)

Uses the DNS protocol to resolve the given host name into IPv6 addresses.

#### Parameters

| Name     | Type     | Description          |
| -------- | -------- | -------------------- |
| hostname | `string` | host name to resolve |

#### Returns

| Type                     | Description                                |
| ------------------------ | ------------------------------------------ |
| `Promise<Array<string>>` | returns a Promise resolving IPv6 addresses |

#### Example

```js
const DnsOverHttpResolver = require('dns-over-http-resolver')
const resolver = new DnsOverHttpResolver()

const hostname = 'google.com'

const address = await resolver.resolve6(hostname) // ['2a00:1450:4001:801::200e']
```

### resolveTxt(hostname)

Uses the DNS protocol to resolve the given host name into a Text Record.

#### Parameters

| Name     | Type     | Description          |
| -------- | -------- | -------------------- |
| hostname | `string` | host name to resolve |

#### Returns

| Type                            | Description                               |
| ------------------------------- | ----------------------------------------- |
| `Promise<Array<Array<string>>>` | returns a Promise resolving a Text Record |

#### Example

```js
const DnsOverHttpResolver = require('dns-over-http-resolver')
const resolver = new DnsOverHttpResolver()

const hostname = 'google.com'

const address = await resolver.resolveTxt(hostname) // [['v=spf1 -all']]
```

### getServers()

Get an array of the IP addresses currently configured for DNS resolution.
These addresses are formatted according to RFC 5952. It can include a custom port.

#### Returns

| Type            | Description                       |
| --------------- | --------------------------------- |
| `Array<string>` | returns array of DNS servers used |

#### Example

```js
const DnsOverHttpResolver = require('dns-over-http-resolver')

const resolver = new DnsOverHttpResolver()
const servers = resolver.getServers()
```

### setServers(servers)

Sets the IP address and port of servers to be used when performing DNS resolution.
Note that the servers order will be randomized on each request for load distribution.

#### Parameters

| Name    | Type            | Description                            |
| ------- | --------------- | -------------------------------------- |
| servers | `Array<string>` | Array of RFC 5952 formatted addresses. |

#### Example

```js
const DnsOverHttpResolver = require('dns-over-http-resolver')

const resolver = new DnsOverHttpResolver()
resolver.setServers(['https://cloudflare-dns.com/dns-query'])
```

## Contribute

Feel free to dive in! [Open an issue](https://github.com/vasco-santos/dns-over-http-resolver/issues/new) or submit PRs.

## API Docs

- <https://vasco-santos.github.io/dns-over-http-resolver>

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
