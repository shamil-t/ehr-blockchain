/** The decoded string representation of the arguments supplied to console.log */
export type ConsoleLogArgs = string[];
export type ConsoleLogs = ConsoleLogArgs[];
export declare class ConsoleLogger {
    #private;
    /**
     * Temporary code to print console.sol messages that come from EDR
     */
    static getDecodedLogs(messages: Buffer[]): string[];
    /**
     * Returns a formatted string using the first argument as a `printf`-like
     * format string which can contain zero or more format specifiers.
     *
     * If there are more arguments passed than the number of specifiers, the
     * extra arguments are concatenated to the returned string, separated by spaces.
     */
    static format(args?: ConsoleLogArgs): string;
}
//# sourceMappingURL=console-logger.d.ts.map