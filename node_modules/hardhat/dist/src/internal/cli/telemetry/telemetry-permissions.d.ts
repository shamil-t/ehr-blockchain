/**
 * Checks whether telemetry is supported in the current environment and whether the user did not explicitly disable it.
 *
 * @param telemetryConfigFilePath - The path to the telemetry config file, which should only be provided in tests.
 * @returns True if the user did not explicitly disable telemetry and if current environment supports it, false otherwise.
 */
export declare function isTelemetryAllowed(telemetryConfigFilePath?: string): Promise<boolean>;
/**
 * Determines if telemetry is allowed in the current environment.
 * This function checks various environmental factors to decide if telemetry data can be collected.
 * It verifies that the environment is not a CI environment, that the terminal is interactive,
 * and that telemetry has not been explicitly disabled through an environment variable.
 *
 * @returns True if telemetry is allowed in the environment, false otherwise.
 */
export declare function isTelemetryAllowedInEnvironment(): boolean;
export declare function setTelemetryEnabled(value: boolean): Promise<boolean>;
//# sourceMappingURL=telemetry-permissions.d.ts.map