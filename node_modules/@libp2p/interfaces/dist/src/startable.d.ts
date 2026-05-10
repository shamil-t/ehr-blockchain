/**
 * Implemented by components that have a lifecycle
 */
export interface Startable {
    isStarted: () => boolean;
    /**
     * If implemented, this method will be invoked before the start method.
     *
     * It should not assume any other components have been started.
     */
    beforeStart?: () => void | Promise<void>;
    /**
     * This method will be invoked to start the component.
     *
     * It should not assume that any other components have been started.
     */
    start: () => void | Promise<void>;
    /**
     * If implemented, this method will be invoked after the start method.
     *
     * All other components will have had their start method invoked before this method is called.
     */
    afterStart?: () => void | Promise<void>;
    /**
     * If implemented, this method will be invoked before the stop method.
     *
     * Any other components will still be running when this method is called.
     */
    beforeStop?: () => void | Promise<void>;
    /**
     * This method will be invoked to stop the component.
     *
     * It should not assume any other components are running when it is called.
     */
    stop: () => void | Promise<void>;
    /**
     * If implemented, this method will be invoked after the stop method.
     *
     * All other components will have had their stop method invoked before this method is called.
     */
    afterStop?: () => void | Promise<void>;
}
export declare function isStartable(obj: any): obj is Startable;
export declare function start(...objs: any[]): Promise<void>;
export declare function stop(...objs: any[]): Promise<void>;
//# sourceMappingURL=startable.d.ts.map