# @chainsafe/is-ip

> Check if a string is an IP address

## Install

```bash
npm install @chainsafe/is-ip
```

## Example

Check if a string is an IP address

```typescript
import { expect } from "chai";
import {
	isIPv4,
	isIPv6,
	isIP,
	ipVersion,
} from "@chainsafe/is-ip";

// check if a string is a valid IPv4
expect(isIPv4("127.0.0.1")).to.equal(true);

// check if a string is a valid IPv6
expect(isIPv6("127.0.0.1")).to.equal(false);

// check if a string is a valid IPv4 or IPv6
expect(isIP("127.0.0.1")).to.equal(true);

// return 4, 6, or undefined
expect(ipVersion("127.0.0.1")).to.equal(4);
expect(ipVersion("1:2:3:4:5:6:7:8")).to.equal(6);
expect(ipVersion("invalid ip")).to.equal(undefined);
```

Parse a string into IP address bytes

```typescript
import { expect } from "chai";
import {
	parseIPv4,
	parseIPv6,
	parseIP,
} from "@chainsafe/is-ip/parse";

// parse a string into IPv4 bytes
const b1 = parseIPv4("127.0.0.1");
expect(b1).to.deep.equal(Uint8Array.from([127, 0, 0, 1]));

// parse a string into IPv6 bytes
const b2 = parseIPv6("::1");
expect(b2).to.deep.equal(Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]));

// parse a string into either IPv4 or IPv6 bytes
const b3 = parseIP("127.0.0.1");
expect(b3).to.deep.equal(Uint8Array.from([127, 0, 0, 1]));

const b4 = parseIP("::1");
expect(b4).to.deep.equal(Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]));

// parseIP* functions return undefined on invalid input
expect(parseIP("not an IP")).to.equal(undefined);
```

## License

MIT
