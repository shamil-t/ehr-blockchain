/**
 * Formats and logs error messages based on the category the error belongs to.
 *
 * @param error the error to handle. Supported categories are defined in
 * {@link ErrorCategory}.
 * @param shouldShowStackTraces whether to show stack traces or not. If true,
 * the stack trace is always shown. If false, the stack trace is only shown for
 * errors of category {@link ErrorCategory.OTHER}.
 * @param print the function used to print the error message, defaults to
 * `console.error`. Useful for testing to capture error messages.
 */
export declare function printErrorMessages(error: Error, shouldShowStackTraces?: boolean, print?: (message: string | Error) => void): void;
//# sourceMappingURL=error-handler.d.ts.map