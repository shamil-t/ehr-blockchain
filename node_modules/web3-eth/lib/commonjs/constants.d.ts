import { FMT_BYTES, FMT_NUMBER } from 'web3-types';
export declare const ALL_EVENTS = "ALLEVENTS";
export declare const ALL_EVENTS_ABI: import("web3-types").AbiBaseFragment & {
    readonly name: string;
    readonly type: string;
    readonly inputs?: readonly import("web3-types").AbiParameter[] | undefined;
    readonly anonymous?: boolean | undefined;
} & {
    signature: string;
};
export declare const NUMBER_DATA_FORMAT: {
    readonly bytes: FMT_BYTES.HEX;
    readonly number: FMT_NUMBER.NUMBER;
};
