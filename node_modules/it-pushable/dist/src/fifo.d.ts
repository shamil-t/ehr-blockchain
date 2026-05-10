export interface Next<T> {
    done?: boolean;
    error?: Error;
    value?: T;
}
export interface FIFOOptions {
    /**
     * When the queue reaches this size, it will be split into head/tail parts
     */
    splitLimit?: number;
}
export declare class FIFO<T> {
    size: number;
    private readonly hwm;
    private head;
    private tail;
    constructor(options?: FIFOOptions);
    calculateSize(obj: any): number;
    push(val: Next<T>): void;
    shift(): Next<T> | undefined;
    isEmpty(): boolean;
}
//# sourceMappingURL=fifo.d.ts.map