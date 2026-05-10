type Fn = (...foo: any) => any;
export declare class Parser {
    private index;
    private input;
    new(input: string): this;
    /** Run a parser, and restore the pre-parse state if it fails. */
    readAtomically<T extends Fn>(fn: T): ReturnType<T>;
    /** Run a parser, but fail if the entire input wasn't consumed. Doesn't run atomically. */
    parseWith<T extends Fn>(fn: T): ReturnType<T> | undefined;
    /** Peek the next character from the input */
    peekChar(): string | undefined;
    /** Read the next character from the input */
    readChar(): string | undefined;
    /** Read the next character from the input if it matches the target. */
    readGivenChar(target: string): string | undefined;
    /**
     * Helper for reading separators in an indexed loop. Reads the separator
     * character iff index > 0, then runs the parser. When used in a loop,
     * the separator character will only be read on index > 0 (see
     * readIPv4Addr for an example)
     */
    readSeparator<T extends Fn>(sep: string, index: number, inner: T): ReturnType<T>;
    /**
     * Read a number off the front of the input in the given radix, stopping
     * at the first non-digit character or eof. Fails if the number has more
     * digits than max_digits or if there is no number.
     */
    readNumber(radix: number, maxDigits: number | undefined, allowZeroPrefix: boolean, maxBytes: number): number | undefined;
    /** Read an IPv4 address. */
    readIPv4Addr(): Uint8Array | undefined;
    /** Read an IPv6 Address. */
    readIPv6Addr(): Uint8Array | undefined;
    /** Read an IP Address, either IPv4 or IPv6. */
    readIPAddr(): Uint8Array | undefined;
}
export {};
//# sourceMappingURL=parser.d.ts.map