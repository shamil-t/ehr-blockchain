/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Inject, Injectable, InjectionToken, NgZone, ɵRuntimeError as RuntimeError } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * The injection token for the event-manager plug-in service.
 *
 * @publicApi
 */
export const EVENT_MANAGER_PLUGINS = new InjectionToken('EventManagerPlugins');
/**
 * An injectable service that provides event management for Angular
 * through a browser plug-in.
 *
 * @publicApi
 */
export class EventManager {
    /**
     * Initializes an instance of the event-manager service.
     */
    constructor(plugins, _zone) {
        this._zone = _zone;
        this._eventNameToPlugin = new Map();
        plugins.forEach((plugin) => {
            plugin.manager = this;
        });
        this._plugins = plugins.slice().reverse();
    }
    /**
     * Registers a handler for a specific element and event.
     *
     * @param element The HTML element to receive event notifications.
     * @param eventName The name of the event to listen for.
     * @param handler A function to call when the notification occurs. Receives the
     * event object as an argument.
     * @returns  A callback function that can be used to remove the handler.
     */
    addEventListener(element, eventName, handler) {
        const plugin = this._findPluginFor(eventName);
        return plugin.addEventListener(element, eventName, handler);
    }
    /**
     * Retrieves the compilation zone in which event listeners are registered.
     */
    getZone() {
        return this._zone;
    }
    /** @internal */
    _findPluginFor(eventName) {
        let plugin = this._eventNameToPlugin.get(eventName);
        if (plugin) {
            return plugin;
        }
        const plugins = this._plugins;
        plugin = plugins.find((plugin) => plugin.supports(eventName));
        if (!plugin) {
            throw new RuntimeError(5101 /* RuntimeErrorCode.NO_PLUGIN_FOR_EVENT */, (typeof ngDevMode === 'undefined' || ngDevMode) &&
                `No event manager plugin found for event ${eventName}`);
        }
        this._eventNameToPlugin.set(eventName, plugin);
        return plugin;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: EventManager, deps: [{ token: EVENT_MANAGER_PLUGINS }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: EventManager }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: EventManager, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [EVENT_MANAGER_PLUGINS]
                }] }, { type: i0.NgZone }]; } });
export class EventManagerPlugin {
    constructor(_doc) {
        this._doc = _doc;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRfbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3BsYXRmb3JtLWJyb3dzZXIvc3JjL2RvbS9ldmVudHMvZXZlbnRfbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLGFBQWEsSUFBSSxZQUFZLEVBQUMsTUFBTSxlQUFlLENBQUM7O0FBSXhHOzs7O0dBSUc7QUFDSCxNQUFNLENBQUMsTUFBTSxxQkFBcUIsR0FDOUIsSUFBSSxjQUFjLENBQXVCLHFCQUFxQixDQUFDLENBQUM7QUFFcEU7Ozs7O0dBS0c7QUFFSCxNQUFNLE9BQU8sWUFBWTtJQUl2Qjs7T0FFRztJQUNILFlBQTJDLE9BQTZCLEVBQVUsS0FBYTtRQUFiLFVBQUssR0FBTCxLQUFLLENBQVE7UUFMdkYsdUJBQWtCLEdBQUcsSUFBSSxHQUFHLEVBQThCLENBQUM7UUFNakUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ3pCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3hCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDNUMsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0gsZ0JBQWdCLENBQUMsT0FBb0IsRUFBRSxTQUFpQixFQUFFLE9BQWlCO1FBQ3pFLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDOUMsT0FBTyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxPQUFPO1FBQ0wsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7SUFFRCxnQkFBZ0I7SUFDaEIsY0FBYyxDQUFDLFNBQWlCO1FBQzlCLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDcEQsSUFBSSxNQUFNLEVBQUU7WUFDVixPQUFPLE1BQU0sQ0FBQztTQUNmO1FBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUM5QixNQUFNLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQzlELElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxNQUFNLElBQUksWUFBWSxrREFFbEIsQ0FBQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDO2dCQUMzQywyQ0FBMkMsU0FBUyxFQUFFLENBQUMsQ0FBQztTQUNqRTtRQUVELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQy9DLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7eUhBckRVLFlBQVksa0JBT0gscUJBQXFCOzZIQVA5QixZQUFZOztzR0FBWixZQUFZO2tCQUR4QixVQUFVOzswQkFRSSxNQUFNOzJCQUFDLHFCQUFxQjs7QUFpRDNDLE1BQU0sT0FBZ0Isa0JBQWtCO0lBQ3RDLFlBQW9CLElBQVM7UUFBVCxTQUFJLEdBQUosSUFBSSxDQUFLO0lBQUcsQ0FBQztDQVFsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5cbmltcG9ydCB7SW5qZWN0LCBJbmplY3RhYmxlLCBJbmplY3Rpb25Ub2tlbiwgTmdab25lLCDJtVJ1bnRpbWVFcnJvciBhcyBSdW50aW1lRXJyb3J9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge1J1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9ycyc7XG5cbi8qKlxuICogVGhlIGluamVjdGlvbiB0b2tlbiBmb3IgdGhlIGV2ZW50LW1hbmFnZXIgcGx1Zy1pbiBzZXJ2aWNlLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IEVWRU5UX01BTkFHRVJfUExVR0lOUyA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPEV2ZW50TWFuYWdlclBsdWdpbltdPignRXZlbnRNYW5hZ2VyUGx1Z2lucycpO1xuXG4vKipcbiAqIEFuIGluamVjdGFibGUgc2VydmljZSB0aGF0IHByb3ZpZGVzIGV2ZW50IG1hbmFnZW1lbnQgZm9yIEFuZ3VsYXJcbiAqIHRocm91Z2ggYSBicm93c2VyIHBsdWctaW4uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgRXZlbnRNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBfcGx1Z2luczogRXZlbnRNYW5hZ2VyUGx1Z2luW107XG4gIHByaXZhdGUgX2V2ZW50TmFtZVRvUGx1Z2luID0gbmV3IE1hcDxzdHJpbmcsIEV2ZW50TWFuYWdlclBsdWdpbj4oKTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYW4gaW5zdGFuY2Ugb2YgdGhlIGV2ZW50LW1hbmFnZXIgc2VydmljZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKEBJbmplY3QoRVZFTlRfTUFOQUdFUl9QTFVHSU5TKSBwbHVnaW5zOiBFdmVudE1hbmFnZXJQbHVnaW5bXSwgcHJpdmF0ZSBfem9uZTogTmdab25lKSB7XG4gICAgcGx1Z2lucy5mb3JFYWNoKChwbHVnaW4pID0+IHtcbiAgICAgIHBsdWdpbi5tYW5hZ2VyID0gdGhpcztcbiAgICB9KTtcbiAgICB0aGlzLl9wbHVnaW5zID0gcGx1Z2lucy5zbGljZSgpLnJldmVyc2UoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBoYW5kbGVyIGZvciBhIHNwZWNpZmljIGVsZW1lbnQgYW5kIGV2ZW50LlxuICAgKlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgSFRNTCBlbGVtZW50IHRvIHJlY2VpdmUgZXZlbnQgbm90aWZpY2F0aW9ucy5cbiAgICogQHBhcmFtIGV2ZW50TmFtZSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQgdG8gbGlzdGVuIGZvci5cbiAgICogQHBhcmFtIGhhbmRsZXIgQSBmdW5jdGlvbiB0byBjYWxsIHdoZW4gdGhlIG5vdGlmaWNhdGlvbiBvY2N1cnMuIFJlY2VpdmVzIHRoZVxuICAgKiBldmVudCBvYmplY3QgYXMgYW4gYXJndW1lbnQuXG4gICAqIEByZXR1cm5zICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gcmVtb3ZlIHRoZSBoYW5kbGVyLlxuICAgKi9cbiAgYWRkRXZlbnRMaXN0ZW5lcihlbGVtZW50OiBIVE1MRWxlbWVudCwgZXZlbnROYW1lOiBzdHJpbmcsIGhhbmRsZXI6IEZ1bmN0aW9uKTogRnVuY3Rpb24ge1xuICAgIGNvbnN0IHBsdWdpbiA9IHRoaXMuX2ZpbmRQbHVnaW5Gb3IoZXZlbnROYW1lKTtcbiAgICByZXR1cm4gcGx1Z2luLmFkZEV2ZW50TGlzdGVuZXIoZWxlbWVudCwgZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIGNvbXBpbGF0aW9uIHpvbmUgaW4gd2hpY2ggZXZlbnQgbGlzdGVuZXJzIGFyZSByZWdpc3RlcmVkLlxuICAgKi9cbiAgZ2V0Wm9uZSgpOiBOZ1pvbmUge1xuICAgIHJldHVybiB0aGlzLl96b25lO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfZmluZFBsdWdpbkZvcihldmVudE5hbWU6IHN0cmluZyk6IEV2ZW50TWFuYWdlclBsdWdpbiB7XG4gICAgbGV0IHBsdWdpbiA9IHRoaXMuX2V2ZW50TmFtZVRvUGx1Z2luLmdldChldmVudE5hbWUpO1xuICAgIGlmIChwbHVnaW4pIHtcbiAgICAgIHJldHVybiBwbHVnaW47XG4gICAgfVxuXG4gICAgY29uc3QgcGx1Z2lucyA9IHRoaXMuX3BsdWdpbnM7XG4gICAgcGx1Z2luID0gcGx1Z2lucy5maW5kKChwbHVnaW4pID0+IHBsdWdpbi5zdXBwb3J0cyhldmVudE5hbWUpKTtcbiAgICBpZiAoIXBsdWdpbikge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLk5PX1BMVUdJTl9GT1JfRVZFTlQsXG4gICAgICAgICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiZcbiAgICAgICAgICAgICAgYE5vIGV2ZW50IG1hbmFnZXIgcGx1Z2luIGZvdW5kIGZvciBldmVudCAke2V2ZW50TmFtZX1gKTtcbiAgICB9XG5cbiAgICB0aGlzLl9ldmVudE5hbWVUb1BsdWdpbi5zZXQoZXZlbnROYW1lLCBwbHVnaW4pO1xuICAgIHJldHVybiBwbHVnaW47XG4gIH1cbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEV2ZW50TWFuYWdlclBsdWdpbiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2RvYzogYW55KSB7fVxuXG4gIC8vIFVzaW5nIG5vbi1udWxsIGFzc2VydGlvbiBiZWNhdXNlIGl0J3Mgc2V0IGJ5IEV2ZW50TWFuYWdlcidzIGNvbnN0cnVjdG9yXG4gIG1hbmFnZXIhOiBFdmVudE1hbmFnZXI7XG5cbiAgYWJzdHJhY3Qgc3VwcG9ydHMoZXZlbnROYW1lOiBzdHJpbmcpOiBib29sZWFuO1xuXG4gIGFic3RyYWN0IGFkZEV2ZW50TGlzdGVuZXIoZWxlbWVudDogSFRNTEVsZW1lbnQsIGV2ZW50TmFtZTogc3RyaW5nLCBoYW5kbGVyOiBGdW5jdGlvbik6IEZ1bmN0aW9uO1xufVxuIl19