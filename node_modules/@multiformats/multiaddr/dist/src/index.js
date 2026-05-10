/**
 * @packageDocumentation
 *
 * An implementation of a Multiaddr in JavaScript
 *
 * @example
 *
 * ```js
 * import { multiaddr } from '@multiformats/multiaddr'
 *
 * const ma = multiaddr('/ip4/127.0.0.1/tcp/1234')
 * ```
 */
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _DefaultMultiaddr_string, _DefaultMultiaddr_tuples, _DefaultMultiaddr_stringTuples, _a;
import * as codec from './codec.js';
import { getProtocol, names } from './protocols-table.js';
import varint from 'varint';
import { CID } from 'multiformats/cid';
import { base58btc } from 'multiformats/bases/base58';
import errCode from 'err-code';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { equals as uint8ArrayEquals } from 'uint8arrays/equals';
const inspect = Symbol.for('nodejs.util.inspect.custom');
const DNS_CODES = [
    getProtocol('dns').code,
    getProtocol('dns4').code,
    getProtocol('dns6').code,
    getProtocol('dnsaddr').code
];
/**
 * All configured {@link Resolver}s
 */
export const resolvers = new Map();
const symbol = Symbol.for('@multiformats/js-multiaddr/multiaddr');
/**
 * Creates a Multiaddr from a node-friendly address object
 *
 * @example
 * ```js
 * import { fromNodeAddress } from '@multiformats/multiaddr'
 *
 * fromNodeAddress({address: '127.0.0.1', port: '4001'}, 'tcp')
 * // Multiaddr(/ip4/127.0.0.1/tcp/4001)
 * ```
 */
export function fromNodeAddress(addr, transport) {
    if (addr == null) {
        throw new Error('requires node address object');
    }
    if (transport == null) {
        throw new Error('requires transport protocol');
    }
    let ip;
    let host = addr.address;
    switch (addr.family) {
        case 4:
            ip = 'ip4';
            break;
        case 6:
            ip = 'ip6';
            if (host.includes('%')) {
                const parts = host.split('%');
                if (parts.length !== 2) {
                    throw Error('Multiple ip6 zones in multiaddr');
                }
                host = parts[0];
                const zone = parts[1];
                ip = `/ip6zone/${zone}/ip6`;
            }
            break;
        default:
            throw Error('Invalid addr family, should be 4 or 6.');
    }
    return new DefaultMultiaddr('/' + [ip, host, transport, addr.port].join('/'));
}
/**
 * Returns if something is a {@link Multiaddr} that is a resolvable name
 *
 * @example
 *
 * ```js
 * import { isName, multiaddr } from '@multiformats/multiaddr'
 *
 * isName(multiaddr('/ip4/127.0.0.1'))
 * // false
 * isName(multiaddr('/dns/ipfs.io'))
 * // true
 * ```
 */
export function isName(addr) {
    if (!isMultiaddr(addr)) {
        return false;
    }
    // if a part of the multiaddr is resolvable, then return true
    return addr.protos().some((proto) => proto.resolvable);
}
/**
 * Check if object is a {@link Multiaddr} instance
 *
 * @example
 *
 * ```js
 * import { isMultiaddr, multiaddr } from '@multiformats/multiaddr'
 *
 * isMultiaddr(5)
 * // false
 * isMultiaddr(multiaddr('/ip4/127.0.0.1'))
 * // true
 * ```
 */
export function isMultiaddr(value) {
    return Boolean(value?.[symbol]);
}
/**
 * Creates a {@link Multiaddr} from a {@link MultiaddrInput}
 */
class DefaultMultiaddr {
    constructor(addr) {
        _DefaultMultiaddr_string.set(this, void 0);
        _DefaultMultiaddr_tuples.set(this, void 0);
        _DefaultMultiaddr_stringTuples.set(this, void 0);
        this[_a] = true;
        // default
        if (addr == null) {
            addr = '';
        }
        if (addr instanceof Uint8Array) {
            this.bytes = codec.fromBytes(addr);
        }
        else if (typeof addr === 'string') {
            if (addr.length > 0 && addr.charAt(0) !== '/') {
                throw new Error(`multiaddr "${addr}" must start with a "/"`);
            }
            this.bytes = codec.fromString(addr);
        }
        else if (isMultiaddr(addr)) { // Multiaddr
            this.bytes = codec.fromBytes(addr.bytes); // validate + copy buffer
        }
        else {
            throw new Error('addr must be a string, Buffer, or another Multiaddr');
        }
    }
    toString() {
        if (__classPrivateFieldGet(this, _DefaultMultiaddr_string, "f") == null) {
            __classPrivateFieldSet(this, _DefaultMultiaddr_string, codec.bytesToString(this.bytes), "f");
        }
        return __classPrivateFieldGet(this, _DefaultMultiaddr_string, "f");
    }
    toJSON() {
        return this.toString();
    }
    toOptions() {
        let family;
        let transport;
        let host;
        let port;
        let zone = '';
        const tcp = getProtocol('tcp');
        const udp = getProtocol('udp');
        const ip4 = getProtocol('ip4');
        const ip6 = getProtocol('ip6');
        const dns6 = getProtocol('dns6');
        const ip6zone = getProtocol('ip6zone');
        for (const [code, value] of this.stringTuples()) {
            if (code === ip6zone.code) {
                zone = `%${value ?? ''}`;
            }
            // default to https when protocol & port are omitted from DNS addrs
            if (DNS_CODES.includes(code)) {
                transport = tcp.name;
                port = 443;
                host = `${value ?? ''}${zone}`;
                family = code === dns6.code ? 6 : 4;
            }
            if (code === tcp.code || code === udp.code) {
                transport = getProtocol(code).name;
                port = parseInt(value ?? '');
            }
            if (code === ip4.code || code === ip6.code) {
                transport = getProtocol(code).name;
                host = `${value ?? ''}${zone}`;
                family = code === ip6.code ? 6 : 4;
            }
        }
        if (family == null || transport == null || host == null || port == null) {
            throw new Error('multiaddr must have a valid format: "/{ip4, ip6, dns4, dns6, dnsaddr}/{address}/{tcp, udp}/{port}".');
        }
        const opts = {
            family,
            host,
            transport,
            port
        };
        return opts;
    }
    protos() {
        return this.protoCodes().map(code => Object.assign({}, getProtocol(code)));
    }
    protoCodes() {
        const codes = [];
        const buf = this.bytes;
        let i = 0;
        while (i < buf.length) {
            const code = varint.decode(buf, i);
            const n = varint.decode.bytes ?? 0;
            const p = getProtocol(code);
            const size = codec.sizeForAddr(p, buf.slice(i + n));
            i += (size + n);
            codes.push(code);
        }
        return codes;
    }
    protoNames() {
        return this.protos().map(proto => proto.name);
    }
    tuples() {
        if (__classPrivateFieldGet(this, _DefaultMultiaddr_tuples, "f") == null) {
            __classPrivateFieldSet(this, _DefaultMultiaddr_tuples, codec.bytesToTuples(this.bytes), "f");
        }
        return __classPrivateFieldGet(this, _DefaultMultiaddr_tuples, "f");
    }
    stringTuples() {
        if (__classPrivateFieldGet(this, _DefaultMultiaddr_stringTuples, "f") == null) {
            __classPrivateFieldSet(this, _DefaultMultiaddr_stringTuples, codec.tuplesToStringTuples(this.tuples()), "f");
        }
        return __classPrivateFieldGet(this, _DefaultMultiaddr_stringTuples, "f");
    }
    encapsulate(addr) {
        addr = new DefaultMultiaddr(addr);
        return new DefaultMultiaddr(this.toString() + addr.toString());
    }
    decapsulate(addr) {
        const addrString = addr.toString();
        const s = this.toString();
        const i = s.lastIndexOf(addrString);
        if (i < 0) {
            throw new Error(`Address ${this.toString()} does not contain subaddress: ${addr.toString()}`);
        }
        return new DefaultMultiaddr(s.slice(0, i));
    }
    decapsulateCode(code) {
        const tuples = this.tuples();
        for (let i = tuples.length - 1; i >= 0; i--) {
            if (tuples[i][0] === code) {
                return new DefaultMultiaddr(codec.tuplesToBytes(tuples.slice(0, i)));
            }
        }
        return this;
    }
    getPeerId() {
        try {
            const tuples = this.stringTuples().filter((tuple) => {
                if (tuple[0] === names.ipfs.code) {
                    return true;
                }
                return false;
            });
            // Get the last ipfs tuple ['ipfs', 'peerid string']
            const tuple = tuples.pop();
            if (tuple?.[1] != null) {
                const peerIdStr = tuple[1];
                // peer id is base58btc encoded string but not multibase encoded so add the `z`
                // prefix so we can validate that it is correctly encoded
                if (peerIdStr[0] === 'Q' || peerIdStr[0] === '1') {
                    return uint8ArrayToString(base58btc.decode(`z${peerIdStr}`), 'base58btc');
                }
                // try to parse peer id as CID
                return uint8ArrayToString(CID.parse(peerIdStr).multihash.bytes, 'base58btc');
            }
            return null;
        }
        catch (e) {
            return null;
        }
    }
    getPath() {
        let path = null;
        try {
            path = this.stringTuples().filter((tuple) => {
                const proto = getProtocol(tuple[0]);
                if (proto.path === true) {
                    return true;
                }
                return false;
            })[0][1];
            if (path == null) {
                path = null;
            }
        }
        catch {
            path = null;
        }
        return path;
    }
    equals(addr) {
        return uint8ArrayEquals(this.bytes, addr.bytes);
    }
    async resolve(options) {
        const resolvableProto = this.protos().find((p) => p.resolvable);
        // Multiaddr is not resolvable?
        if (resolvableProto == null) {
            return [this];
        }
        const resolver = resolvers.get(resolvableProto.name);
        if (resolver == null) {
            throw errCode(new Error(`no available resolver for ${resolvableProto.name}`), 'ERR_NO_AVAILABLE_RESOLVER');
        }
        const addresses = await resolver(this, options);
        return addresses.map((a) => new DefaultMultiaddr(a));
    }
    nodeAddress() {
        const options = this.toOptions();
        if (options.transport !== 'tcp' && options.transport !== 'udp') {
            throw new Error(`multiaddr must have a valid format - no protocol with name: "${options.transport}". Must have a valid transport protocol: "{tcp, udp}"`);
        }
        return {
            family: options.family,
            address: options.host,
            port: options.port
        };
    }
    isThinWaistAddress(addr) {
        const protos = (addr ?? this).protos();
        if (protos.length !== 2) {
            return false;
        }
        if (protos[0].code !== 4 && protos[0].code !== 41) {
            return false;
        }
        if (protos[1].code !== 6 && protos[1].code !== 273) {
            return false;
        }
        return true;
    }
    /**
     * Returns Multiaddr as a human-readable string
     * https://nodejs.org/api/util.html#utilinspectcustom
     *
     * @example
     * ```js
     * import { multiaddr } from '@multiformats/multiaddr'
     *
     * console.info(multiaddr('/ip4/127.0.0.1/tcp/4001'))
     * // 'Multiaddr(/ip4/127.0.0.1/tcp/4001)'
     * ```
     */
    [(_DefaultMultiaddr_string = new WeakMap(), _DefaultMultiaddr_tuples = new WeakMap(), _DefaultMultiaddr_stringTuples = new WeakMap(), _a = symbol, inspect)]() {
        return `Multiaddr(${codec.bytesToString(this.bytes)})`;
    }
}
/**
 * A function that takes a {@link MultiaddrInput} and returns a {@link Multiaddr}
 *
 * @example
 * ```js
 * import { multiaddr } from '@libp2p/multiaddr'
 *
 * multiaddr('/ip4/127.0.0.1/tcp/4001')
 * // Multiaddr(/ip4/127.0.0.1/tcp/4001)
 * ```
 *
 * @param {MultiaddrInput} [addr] - If String or Uint8Array, needs to adhere to the address format of a [multiaddr](https://github.com/multiformats/multiaddr#string-format)
 */
export function multiaddr(addr) {
    return new DefaultMultiaddr(addr);
}
export { getProtocol as protocols };
//# sourceMappingURL=index.js.map