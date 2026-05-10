/* eslint-disable @typescript-eslint/no-unsafe-return */
export class Parser {
    index = 0;
    input = "";
    new(input) {
        this.index = 0;
        this.input = input;
        return this;
    }
    /** Run a parser, and restore the pre-parse state if it fails. */
    readAtomically(fn) {
        const index = this.index;
        const result = fn();
        if (result === undefined) {
            this.index = index;
        }
        return result;
    }
    /** Run a parser, but fail if the entire input wasn't consumed. Doesn't run atomically. */
    parseWith(fn) {
        const result = fn();
        if (this.index !== this.input.length) {
            return undefined;
        }
        return result;
    }
    /** Peek the next character from the input */
    peekChar() {
        if (this.index >= this.input.length) {
            return undefined;
        }
        return this.input[this.index];
    }
    /** Read the next character from the input */
    readChar() {
        if (this.index >= this.input.length) {
            return undefined;
        }
        return this.input[this.index++];
    }
    /** Read the next character from the input if it matches the target. */
    readGivenChar(target) {
        return this.readAtomically(() => {
            const char = this.readChar();
            if (char !== target) {
                return undefined;
            }
            return char;
        });
    }
    /**
     * Helper for reading separators in an indexed loop. Reads the separator
     * character iff index > 0, then runs the parser. When used in a loop,
     * the separator character will only be read on index > 0 (see
     * readIPv4Addr for an example)
     */
    readSeparator(sep, index, inner) {
        return this.readAtomically(() => {
            if (index > 0) {
                if (this.readGivenChar(sep) === undefined) {
                    return undefined;
                }
            }
            return inner();
        });
    }
    /**
     * Read a number off the front of the input in the given radix, stopping
     * at the first non-digit character or eof. Fails if the number has more
     * digits than max_digits or if there is no number.
     */
    readNumber(radix, maxDigits, allowZeroPrefix, maxBytes) {
        return this.readAtomically(() => {
            let result = 0;
            let digitCount = 0;
            const leadingChar = this.peekChar();
            if (leadingChar === undefined) {
                return undefined;
            }
            const hasLeadingZero = leadingChar === "0";
            const maxValue = 2 ** (8 * maxBytes) - 1;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const digit = this.readAtomically(() => {
                    const char = this.readChar();
                    if (char === undefined) {
                        return undefined;
                    }
                    const num = Number.parseInt(char, radix);
                    if (Number.isNaN(num)) {
                        return undefined;
                    }
                    return num;
                });
                if (digit === undefined) {
                    break;
                }
                result *= radix;
                result += digit;
                if (result > maxValue) {
                    return undefined;
                }
                digitCount += 1;
                if (maxDigits !== undefined) {
                    if (digitCount > maxDigits) {
                        return undefined;
                    }
                }
            }
            if (digitCount === 0) {
                return undefined;
            }
            else if (!allowZeroPrefix && hasLeadingZero && digitCount > 1) {
                return undefined;
            }
            else {
                return result;
            }
        });
    }
    /** Read an IPv4 address. */
    readIPv4Addr() {
        return this.readAtomically(() => {
            const out = new Uint8Array(4);
            for (let i = 0; i < out.length; i++) {
                const ix = this.readSeparator(".", i, () => this.readNumber(10, 3, false, 1));
                if (ix === undefined) {
                    return undefined;
                }
                out[i] = ix;
            }
            return out;
        });
    }
    /** Read an IPv6 Address. */
    readIPv6Addr() {
        /**
         * Read a chunk of an IPv6 address into `groups`. Returns the number
         * of groups read, along with a bool indicating if an embedded
         * trailing IPv4 address was read. Specifically, read a series of
         * colon-separated IPv6 groups (0x0000 - 0xFFFF), with an optional
         * trailing embedded IPv4 address.
         */
        const readGroups = (groups) => {
            for (let i = 0; i < groups.length / 2; i++) {
                const ix = i * 2;
                // Try to read a trailing embedded IPv4 address. There must be at least 4 groups left.
                if (i < groups.length - 3) {
                    const ipv4 = this.readSeparator(":", i, () => this.readIPv4Addr());
                    if (ipv4 !== undefined) {
                        groups[ix] = ipv4[0];
                        groups[ix + 1] = ipv4[1];
                        groups[ix + 2] = ipv4[2];
                        groups[ix + 3] = ipv4[3];
                        return [ix + 4, true];
                    }
                }
                const group = this.readSeparator(":", i, () => this.readNumber(16, 4, true, 2));
                if (group === undefined) {
                    return [ix, false];
                }
                groups[ix] = group >> 8;
                groups[ix + 1] = group & 255;
            }
            return [groups.length, false];
        };
        return this.readAtomically(() => {
            // Read the front part of the address; either the whole thing, or up to the first ::
            const head = new Uint8Array(16);
            const [headSize, headIp4] = readGroups(head);
            if (headSize === 16) {
                return head;
            }
            // IPv4 part is not allowed before `::`
            if (headIp4) {
                return undefined;
            }
            // Read `::` if previous code parsed less than 8 groups.
            // `::` indicates one or more groups of 16 bits of zeros.
            if (this.readGivenChar(":") === undefined) {
                return undefined;
            }
            if (this.readGivenChar(":") === undefined) {
                return undefined;
            }
            // Read the back part of the address. The :: must contain at least one
            // set of zeroes, so our max length is 7.
            const tail = new Uint8Array(14);
            const limit = 16 - (headSize + 2);
            const [tailSize] = readGroups(tail.subarray(0, limit));
            // Concat the head and tail of the IP address
            head.set(tail.subarray(0, tailSize), 16 - tailSize);
            return head;
        });
    }
    /** Read an IP Address, either IPv4 or IPv6. */
    readIPAddr() {
        return this.readIPv4Addr() ?? this.readIPv6Addr();
    }
}
//# sourceMappingURL=parser.js.map