/** Message sent from a mining worker to the main thread. */
export type Message = {
    type: 'done';
} | {
    type: 'error';
    message: string;
} | {
    type: 'found';
    result: {
        /** The 4-byte master identifier. */
        masterId: string;
        /** The full 32-byte registration hash. */
        registrationHash: string;
        /** The discovered 32-byte salt. */
        salt: string;
    };
} | {
    type: 'progress';
    attempts: number;
};
/** A platform-agnostic worker pool for parallel salt mining. */
export type Pool = {
    spawn(index: number, onMessage: (msg: Message) => void, onError: (err: unknown) => void): {
        postMessage(data: unknown): void;
        terminate(): void;
    };
};
/**
 * Resolves the best available worker pool for the current runtime.
 *
 * @internal
 */
export declare function resolve(): Promise<Pool | undefined>;
/**
 * Creates a worker pool backed by Node.js `worker_threads`.
 *
 * @internal
 */
export declare function resolveNode(): Promise<Pool | undefined>;
/**
 * Creates a worker pool backed by browser `Worker` with Blob URLs.
 *
 * @internal
 */
export declare function resolveBrowser(): Promise<Pool | undefined>;
//# sourceMappingURL=virtualMasterPool.d.ts.map