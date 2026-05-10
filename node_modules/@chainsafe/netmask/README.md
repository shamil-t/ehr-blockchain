
# @chainsafe/netmask

Zero dependency typescript implementation for using netmasks with both ipv4 and ipv6.
Heavily inspired by go implementation.

## Features

* IPv4 and IPv6 support
* Zero dependencies
* [Typescript](https://www.typescriptlang.org/) support

## How to use

`npm i -s @chainsafe/netmask`

or
`yarn add @chainsafe/netmask`

Example usage:

```typescript
import {cidrContains, networkMaskContains} from "@chainsafe/netmask"

cidrContains("192.168.0.1/24", "192.168.0.16")
cidrContains("2001:db8::/128", "2001:db8::")
networkMaskContains("192.168.0.1", "255.255.255.0", "192.168.0.16")
```

## Quick start

1. `yarn`
2. `yarn run build`
3. `yarn run test`
