import type { AppContext, DeviceContext } from '@sentry/core';
export declare const readFileAsync: any;
export declare const readDirAsync: any;
interface DeviceContextOptions {
    cpu?: boolean;
    memory?: boolean;
}
/**
 * Capture context about the environment and the device that the client is running on, to events.
 */
export declare const nodeContextIntegration: any;
/**
 * Get app context information from process
 */
export declare function getAppContext(): AppContext;
/**
 * Gets device information from os
 */
export declare function getDeviceContext(deviceOpt: DeviceContextOptions | true): DeviceContext;
export {};
//# sourceMappingURL=context.d.ts.map