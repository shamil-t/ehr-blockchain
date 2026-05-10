export declare const FRAME_INTERVAL_MS = 80;
export interface ISpinner {
    readonly isEnabled: boolean;
    start(): void;
    stop(): void;
}
/**
 * Optional settings when creating a spinner.
 */
export interface SpinnerOptions {
    /**
     * Text shown next to the spinner.
     */
    text?: string;
    /**
     * Stream used to write frames.
     */
    stream?: NodeJS.WriteStream;
    /**
     * Whether the spinner is enabled.
     */
    enabled?: boolean;
}
/**
 * Create a spinner instance.
 *
 * @example
 * ```typescript
 * const spinner = createSpinner({ text: "Compiling…" });
 * spinner.start();
 *
 * try {
 *   await compileContracts();
 *   spinner.stop();
 *   console.log("Compiled 12 contracts");
 * } catch (error) {
 *   spinner.stop();
 *   console.error("Compilation failed");
 * }
 * ```
 *
 * @param options  Optional spinner configuration.
 * @returns {Spinner} A spinner instance.
 */
export declare function createSpinner(options?: SpinnerOptions): ISpinner;
//# sourceMappingURL=spinner.d.ts.map