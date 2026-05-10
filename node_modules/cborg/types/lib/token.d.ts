export class Type {
    /**
     * @param {number} major
     * @param {string} name
     * @param {boolean} terminal
     */
    constructor(major: number, name: string, terminal: boolean);
    major: number;
    majorEncoded: number;
    name: string;
    terminal: boolean;
    toString(): string;
    /**
     * @param {Type} typ
     * @returns {number}
     */
    compare(typ: Type): number;
}
export namespace Type {
    export let uint: Type;
    export let negint: Type;
    export let bytes: Type;
    export let string: Type;
    export let array: Type;
    export let map: Type;
    export let tag: Type;
    export let float: Type;
    let _false: Type;
    export { _false as false };
    let _true: Type;
    export { _true as true };
    let _null: Type;
    export { _null as null };
    export let undefined: Type;
    let _break: Type;
    export { _break as break };
}
export class Token {
    /**
     * @param {Type} type
     * @param {any} [value]
     * @param {number} [encodedLength]
     */
    constructor(type: Type, value?: any, encodedLength?: number | undefined);
    type: Type;
    value: any;
    encodedLength: number | undefined;
    /** @type {Uint8Array|undefined} */
    encodedBytes: Uint8Array | undefined;
    /** @type {Uint8Array|undefined} */
    byteValue: Uint8Array | undefined;
    toString(): string;
}
//# sourceMappingURL=token.d.ts.map