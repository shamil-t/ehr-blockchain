/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { first } from 'rxjs/operators';
import { APP_BOOTSTRAP_LISTENER, ApplicationRef } from '../application_ref';
import { ENABLED_SSR_FEATURES } from '../application_tokens';
import { Console } from '../console';
import { ENVIRONMENT_INITIALIZER, Injector, makeEnvironmentProviders } from '../di';
import { inject } from '../di/injector_compatibility';
import { formatRuntimeError, RuntimeError } from '../errors';
import { enableLocateOrCreateContainerRefImpl } from '../linker/view_container_ref';
import { enableLocateOrCreateElementNodeImpl } from '../render3/instructions/element';
import { enableLocateOrCreateElementContainerNodeImpl } from '../render3/instructions/element_container';
import { enableApplyRootElementTransformImpl } from '../render3/instructions/shared';
import { enableLocateOrCreateContainerAnchorImpl } from '../render3/instructions/template';
import { enableLocateOrCreateTextNodeImpl } from '../render3/instructions/text';
import { getDocument } from '../render3/interfaces/document';
import { isPlatformBrowser } from '../render3/util/misc_utils';
import { TransferState } from '../transfer_state';
import { NgZone } from '../zone';
import { cleanupDehydratedViews } from './cleanup';
import { IS_HYDRATION_DOM_REUSE_ENABLED, PRESERVE_HOST_CONTENT } from './tokens';
import { enableRetrieveHydrationInfoImpl, NGH_DATA_KEY, SSR_CONTENT_INTEGRITY_MARKER } from './utils';
import { enableFindMatchingDehydratedViewImpl } from './views';
/**
 * Indicates whether the hydration-related code was added,
 * prevents adding it multiple times.
 */
let isHydrationSupportEnabled = false;
/**
 * Defines a period of time that Angular waits for the `ApplicationRef.isStable` to emit `true`.
 * If there was no event with the `true` value during this time, Angular reports a warning.
 */
const APPLICATION_IS_STABLE_TIMEOUT = 10000;
/**
 * Brings the necessary hydration code in tree-shakable manner.
 * The code is only present when the `provideClientHydration` is
 * invoked. Otherwise, this code is tree-shaken away during the
 * build optimization step.
 *
 * This technique allows us to swap implementations of methods so
 * tree shaking works appropriately when hydration is disabled or
 * enabled. It brings in the appropriate version of the method that
 * supports hydration only when enabled.
 */
function enableHydrationRuntimeSupport() {
    if (!isHydrationSupportEnabled) {
        isHydrationSupportEnabled = true;
        enableRetrieveHydrationInfoImpl();
        enableLocateOrCreateElementNodeImpl();
        enableLocateOrCreateTextNodeImpl();
        enableLocateOrCreateElementContainerNodeImpl();
        enableLocateOrCreateContainerAnchorImpl();
        enableLocateOrCreateContainerRefImpl();
        enableFindMatchingDehydratedViewImpl();
        enableApplyRootElementTransformImpl();
    }
}
/**
 * Outputs a message with hydration stats into a console.
 */
function printHydrationStats(injector) {
    const console = injector.get(Console);
    const message = `Angular hydrated ${ngDevMode.hydratedComponents} component(s) ` +
        `and ${ngDevMode.hydratedNodes} node(s), ` +
        `${ngDevMode.componentsSkippedHydration} component(s) were skipped. ` +
        `Note: this feature is in Developer Preview mode. ` +
        `Learn more at https://angular.io/guide/hydration.`;
    // tslint:disable-next-line:no-console
    console.log(message);
}
/**
 * Returns a Promise that is resolved when an application becomes stable.
 */
function whenStable(appRef, injector) {
    const isStablePromise = appRef.isStable.pipe(first((isStable) => isStable)).toPromise();
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        const timeoutTime = APPLICATION_IS_STABLE_TIMEOUT;
        const console = injector.get(Console);
        const ngZone = injector.get(NgZone);
        // The following call should not and does not prevent the app to become stable
        // We cannot use RxJS timer here because the app would remain unstable.
        // This also avoids an extra change detection cycle.
        const timeoutId = ngZone.runOutsideAngular(() => {
            return setTimeout(() => logWarningOnStableTimedout(timeoutTime, console), timeoutTime);
        });
        isStablePromise.finally(() => clearTimeout(timeoutId));
    }
    return isStablePromise.then(() => { });
}
/**
 * Returns a set of providers required to setup hydration support
 * for an application that is server side rendered. This function is
 * included into the `provideClientHydration` public API function from
 * the `platform-browser` package.
 *
 * The function sets up an internal flag that would be recognized during
 * the server side rendering time as well, so there is no need to
 * configure or change anything in NgUniversal to enable the feature.
 */
export function withDomHydration() {
    return makeEnvironmentProviders([
        {
            provide: IS_HYDRATION_DOM_REUSE_ENABLED,
            useFactory: () => {
                let isEnabled = true;
                if (isPlatformBrowser()) {
                    // On the client, verify that the server response contains
                    // hydration annotations. Otherwise, keep hydration disabled.
                    const transferState = inject(TransferState, { optional: true });
                    isEnabled = !!transferState?.get(NGH_DATA_KEY, null);
                    if (!isEnabled && (typeof ngDevMode !== 'undefined' && ngDevMode)) {
                        const console = inject(Console);
                        const message = formatRuntimeError(-505 /* RuntimeErrorCode.MISSING_HYDRATION_ANNOTATIONS */, 'Angular hydration was requested on the client, but there was no ' +
                            'serialized information present in the server response, ' +
                            'thus hydration was not enabled. ' +
                            'Make sure the `provideClientHydration()` is included into the list ' +
                            'of providers in the server part of the application configuration.');
                        // tslint:disable-next-line:no-console
                        console.warn(message);
                    }
                }
                if (isEnabled) {
                    inject(ENABLED_SSR_FEATURES).add('hydration');
                }
                return isEnabled;
            },
        },
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => {
                // Since this function is used across both server and client,
                // make sure that the runtime code is only added when invoked
                // on the client. Moving forward, the `isPlatformBrowser` check should
                // be replaced with a tree-shakable alternative (e.g. `isServer`
                // flag).
                if (isPlatformBrowser() && inject(IS_HYDRATION_DOM_REUSE_ENABLED)) {
                    verifySsrContentsIntegrity();
                    enableHydrationRuntimeSupport();
                }
            },
            multi: true,
        },
        {
            provide: PRESERVE_HOST_CONTENT,
            useFactory: () => {
                // Preserve host element content only in a browser
                // environment and when hydration is configured properly.
                // On a server, an application is rendered from scratch,
                // so the host content needs to be empty.
                return isPlatformBrowser() && inject(IS_HYDRATION_DOM_REUSE_ENABLED);
            }
        },
        {
            provide: APP_BOOTSTRAP_LISTENER,
            useFactory: () => {
                if (isPlatformBrowser() && inject(IS_HYDRATION_DOM_REUSE_ENABLED)) {
                    const appRef = inject(ApplicationRef);
                    const injector = inject(Injector);
                    return () => {
                        // Wait until an app becomes stable and cleanup all views that
                        // were not claimed during the application bootstrap process.
                        // The timing is similar to when we start the serialization process
                        // on the server.
                        //
                        // Note: the cleanup task *MUST* be scheduled within the Angular zone
                        // to ensure that change detection is properly run afterward.
                        whenStable(appRef, injector).then(() => {
                            NgZone.assertInAngularZone();
                            cleanupDehydratedViews(appRef);
                            if (typeof ngDevMode !== 'undefined' && ngDevMode) {
                                printHydrationStats(injector);
                            }
                        });
                    };
                }
                return () => { }; // noop
            },
            multi: true,
        }
    ]);
}
/**
 *
 * @param time The time in ms until the stable timedout warning message is logged
 */
function logWarningOnStableTimedout(time, console) {
    const message = `Angular hydration expected the ApplicationRef.isStable() to emit \`true\`, but it ` +
        `didn't happen within ${time}ms. Angular hydration logic depends on the application becoming stable ` +
        `as a signal to complete hydration process.`;
    console.warn(formatRuntimeError(-506 /* RuntimeErrorCode.HYDRATION_STABLE_TIMEDOUT */, message));
}
/**
 * Verifies whether the DOM contains a special marker added during SSR time to make sure
 * there is no SSR'ed contents transformations happen after SSR is completed. Typically that
 * happens either by CDN or during the build process as an optimization to remove comment nodes.
 * Hydration process requires comment nodes produced by Angular to locate correct DOM segments.
 * When this special marker is *not* present - throw an error and do not proceed with hydration,
 * since it will not be able to function correctly.
 *
 * Note: this function is invoked only on the client, so it's safe to use DOM APIs.
 */
function verifySsrContentsIntegrity() {
    const doc = getDocument();
    let hydrationMarker;
    for (const node of doc.body.childNodes) {
        if (node.nodeType === Node.COMMENT_NODE &&
            node.textContent?.trim() === SSR_CONTENT_INTEGRITY_MARKER) {
            hydrationMarker = node;
            break;
        }
    }
    if (!hydrationMarker) {
        throw new RuntimeError(-507 /* RuntimeErrorCode.MISSING_SSR_CONTENT_INTEGRITY_MARKER */, typeof ngDevMode !== 'undefined' && ngDevMode &&
            'Angular hydration logic detected that HTML content of this page was modified after it ' +
                'was produced during server side rendering. Make sure that there are no optimizations ' +
                'that remove comment nodes from HTML enabled on your CDN. Angular hydration ' +
                'relies on HTML produced by the server, including whitespaces and comment nodes.');
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsS0FBSyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFckMsT0FBTyxFQUFDLHNCQUFzQixFQUFFLGNBQWMsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQzFFLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzNELE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDbkMsT0FBTyxFQUFDLHVCQUF1QixFQUF3QixRQUFRLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDeEcsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3BELE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxZQUFZLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBQzdFLE9BQU8sRUFBQyxvQ0FBb0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ3BGLE9BQU8sRUFBQyw0Q0FBNEMsRUFBQyxNQUFNLDJDQUEyQyxDQUFDO0FBQ3ZHLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ25GLE9BQU8sRUFBQyx1Q0FBdUMsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBQ3pGLE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQzlFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUMzRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7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Z0I7SUFDaEUsTUFBTSxPQUFPLEdBQ1Qsb0ZBQW9GO1FBQ3BGLHdCQUNJLElBQUkseUVBQXlFO1FBQ2pGLDRDQUE0QyxDQUFDO0lBRWpELE9BQU8sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLHdEQUE2QyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3hGLENBQUM7QUFFRDs7Ozs7Ozs7O0dBU0c7QUFDSCxTQUFTLDBCQUEwQjtJQUNqQyxNQUFNLEdBQUcsR0FBRyxXQUFXLEVBQUUsQ0FBQztJQUMxQixJQUFJLGVBQStCLENBQUM7SUFDcEMsS0FBSyxNQUFNLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtRQUN0QyxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFlBQVk7WUFDbkMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsS0FBSyw0QkFBNEIsRUFBRTtZQUM3RCxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBQ3ZCLE1BQU07U0FDUDtLQUNGO0lBQ0QsSUFBSSxDQUFDLGVBQWUsRUFBRTtRQUNwQixNQUFNLElBQUksWUFBWSxtRUFFbEIsT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVM7WUFDekMsd0ZBQXdGO2dCQUNwRix1RkFBdUY7Z0JBQ3ZGLDZFQUE2RTtnQkFDN0UsaUZBQWlGLENBQUMsQ0FBQztLQUNoRztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtmaXJzdH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQge0FQUF9CT09UU1RSQVBfTElTVEVORVIsIEFwcGxpY2F0aW9uUmVmfSBmcm9tICcuLi9hcHBsaWNhdGlvbl9yZWYnO1xuaW1wb3J0IHtFTkFCTEVEX1NTUl9GRUFUVVJFU30gZnJvbSAnLi4vYXBwbGljYXRpb25fdG9rZW5zJztcbmltcG9ydCB7Q29uc29sZX0gZnJvbSAnLi4vY29uc29sZSc7XG5pbXBvcnQge0VOVklST05NRU5UX0lOSVRJQUxJWkVSLCBFbnZpcm9ubWVudFByb3ZpZGVycywgSW5qZWN0b3IsIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVyc30gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtmb3JtYXRSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJSZWZJbXBsfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVFbGVtZW50Tm9kZUltcGx9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VsZW1lbnQnO1xuaW1wb3J0IHtlbmFibGVMb2NhdGVPckNyZWF0ZUVsZW1lbnRDb250YWluZXJOb2RlSW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvZWxlbWVudF9jb250YWluZXInO1xuaW1wb3J0IHtlbmFibGVBcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtSW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJBbmNob3JJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy90ZW1wbGF0ZSc7XG5pbXBvcnQge2VuYWJsZUxvY2F0ZU9yQ3JlYXRlVGV4dE5vZGVJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy90ZXh0JztcbmltcG9ydCB7Z2V0RG9jdW1lbnR9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9kb2N1bWVudCc7XG5pbXBvcnQge2lzUGxhdGZvcm1Ccm93c2VyfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge1RyYW5zZmVyU3RhdGV9IGZyb20gJy4uL3RyYW5zZmVyX3N0YXRlJztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi96b25lJztcblxuaW1wb3J0IHtjbGVhbnVwRGVoeWRyYXRlZFZpZXdzfSBmcm9tICcuL2NsZWFudXAnO1xuaW1wb3J0IHtJU19IWURSQVRJT05fRE9NX1JFVVNFX0VOQUJMRUQsIFBSRVNFUlZFX0hPU1RfQ09OVEVOVH0gZnJvbSAnLi90b2tlbnMnO1xuaW1wb3J0IHtlbmFibGVSZXRyaWV2ZUh5ZHJhdGlvbkluZm9JbXBsLCBOR0hfREFUQV9LRVksIFNTUl9DT05URU5UX0lOVEVHUklUWV9NQVJLRVJ9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHtlbmFibGVGaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlld0ltcGx9IGZyb20gJy4vdmlld3MnO1xuXG4vKipcbiAqIEluZGljYXRlcyB3aGV0aGVyIHRoZSBoeWRyYXRpb24tcmVsYXRlZCBjb2RlIHdhcyBhZGRlZCxcbiAqIHByZXZlbnRzIGFkZGluZyBpdCBtdWx0aXBsZSB0aW1lcy5cbiAqL1xubGV0IGlzSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQgPSBmYWxzZTtcblxuLyoqXG4gKiBEZWZpbmVzIGEgcGVyaW9kIG9mIHRpbWUgdGhhdCBBbmd1bGFyIHdhaXRzIGZvciB0aGUgYEFwcGxpY2F0aW9uUmVmLmlzU3RhYmxlYCB0byBlbWl0IGB0cnVlYC5cbiAqIElmIHRoZXJlIHdhcyBubyBldmVudCB3aXRoIHRoZSBgdHJ1ZWAgdmFsdWUgZHVyaW5nIHRoaXMgdGltZSwgQW5ndWxhciByZXBvcnRzIGEgd2FybmluZy5cbiAqL1xuY29uc3QgQVBQTElDQVRJT05fSVNfU1RBQkxFX1RJTUVPVVQgPSAxMF8wMDA7XG5cbi8qKlxuICogQnJpbmdzIHRoZSBuZWNlc3NhcnkgaHlkcmF0aW9uIGNvZGUgaW4gdHJlZS1zaGFrYWJsZSBtYW5uZXIuXG4gKiBUaGUgY29kZSBpcyBvbmx5IHByZXNlbnQgd2hlbiB0aGUgYHByb3ZpZGVDbGllbnRIeWRyYXRpb25gIGlzXG4gKiBpbnZva2VkLiBPdGhlcndpc2UsIHRoaXMgY29kZSBpcyB0cmVlLXNoYWtlbiBhd2F5IGR1cmluZyB0aGVcbiAqIGJ1aWxkIG9wdGltaXphdGlvbiBzdGVwLlxuICpcbiAqIFRoaXMgdGVjaG5pcXVlIGFsbG93cyB1cyB0byBzd2FwIGltcGxlbWVudGF0aW9ucyBvZiBtZXRob2RzIHNvXG4gKiB0cmVlIHNoYWtpbmcgd29ya3MgYXBwcm9wcmlhdGVseSB3aGVuIGh5ZHJhdGlvbiBpcyBkaXNhYmxlZCBvclxuICogZW5hYmxlZC4gSXQgYnJpbmdzIGluIHRoZSBhcHByb3ByaWF0ZSB2ZXJzaW9uIG9mIHRoZSBtZXRob2QgdGhhdFxuICogc3VwcG9ydHMgaHlkcmF0aW9uIG9ubHkgd2hlbiBlbmFibGVkLlxuICovXG5mdW5jdGlvbiBlbmFibGVIeWRyYXRpb25SdW50aW1lU3VwcG9ydCgpIHtcbiAgaWYgKCFpc0h5ZHJhdGlvblN1cHBvcnRFbmFibGVkKSB7XG4gICAgaXNIeWRyYXRpb25TdXBwb3J0RW5hYmxlZCA9IHRydWU7XG4gICAgZW5hYmxlUmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlRWxlbWVudE5vZGVJbXBsKCk7XG4gICAgZW5hYmxlTG9jYXRlT3JDcmVhdGVUZXh0Tm9kZUltcGwoKTtcbiAgICBlbmFibGVMb2NhdGVPckNyZWF0ZUVsZW1lbnRDb250YWluZXJOb2RlSW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlQ29udGFpbmVyQW5jaG9ySW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlQ29udGFpbmVyUmVmSW1wbCgpO1xuICAgIGVuYWJsZUZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3SW1wbCgpO1xuICAgIGVuYWJsZUFwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm1JbXBsKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBPdXRwdXRzIGEgbWVzc2FnZSB3aXRoIGh5ZHJhdGlvbiBzdGF0cyBpbnRvIGEgY29uc29sZS5cbiAqL1xuZnVuY3Rpb24gcHJpbnRIeWRyYXRpb25TdGF0cyhpbmplY3RvcjogSW5qZWN0b3IpIHtcbiAgY29uc3QgY29uc29sZSA9IGluamVjdG9yLmdldChDb25zb2xlKTtcbiAgY29uc3QgbWVzc2FnZSA9IGBBbmd1bGFyIGh5ZHJhdGVkICR7bmdEZXZNb2RlIS5oeWRyYXRlZENvbXBvbmVudHN9IGNvbXBvbmVudChzKSBgICtcbiAgICAgIGBhbmQgJHtuZ0Rldk1vZGUhLmh5ZHJhdGVkTm9kZXN9IG5vZGUocyksIGAgK1xuICAgICAgYCR7bmdEZXZNb2RlIS5jb21wb25lbnRzU2tpcHBlZEh5ZHJhdGlvbn0gY29tcG9uZW50KHMpIHdlcmUgc2tpcHBlZC4gYCArXG4gICAgICBgTm90ZTogdGhpcyBmZWF0dXJlIGlzIGluIERldmVsb3BlciBQcmV2aWV3IG1vZGUuIGAgK1xuICAgICAgYExlYXJuIG1vcmUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2d1aWRlL2h5ZHJhdGlvbi5gO1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tY29uc29sZVxuICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbn1cblxuXG4vKipcbiAqIFJldHVybnMgYSBQcm9taXNlIHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiBhbiBhcHBsaWNhdGlvbiBiZWNvbWVzIHN0YWJsZS5cbiAqL1xuZnVuY3Rpb24gd2hlblN0YWJsZShhcHBSZWY6IEFwcGxpY2F0aW9uUmVmLCBpbmplY3RvcjogSW5qZWN0b3IpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgaXNTdGFibGVQcm9taXNlID0gYXBwUmVmLmlzU3RhYmxlLnBpcGUoZmlyc3QoKGlzU3RhYmxlOiBib29sZWFuKSA9PiBpc1N0YWJsZSkpLnRvUHJvbWlzZSgpO1xuICBpZiAodHlwZW9mIG5nRGV2TW9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbmdEZXZNb2RlKSB7XG4gICAgY29uc3QgdGltZW91dFRpbWUgPSBBUFBMSUNBVElPTl9JU19TVEFCTEVfVElNRU9VVDtcbiAgICBjb25zdCBjb25zb2xlID0gaW5qZWN0b3IuZ2V0KENvbnNvbGUpO1xuICAgIGNvbnN0IG5nWm9uZSA9IGluamVjdG9yLmdldChOZ1pvbmUpO1xuXG4gICAgLy8gVGhlIGZvbGxvd2luZyBjYWxsIHNob3VsZCBub3QgYW5kIGRvZXMgbm90IHByZXZlbnQgdGhlIGFwcCB0byBiZWNvbWUgc3RhYmxlXG4gICAgLy8gV2UgY2Fubm90IHVzZSBSeEpTIHRpbWVyIGhlcmUgYmVjYXVzZSB0aGUgYXBwIHdvdWxkIHJlbWFpbiB1bnN0YWJsZS5cbiAgICAvLyBUaGlzIGFsc28gYXZvaWRzIGFuIGV4dHJhIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUuXG4gICAgY29uc3QgdGltZW91dElkID0gbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KCgpID0+IGxvZ1dhcm5pbmdPblN0YWJsZVRpbWVkb3V0KHRpbWVvdXRUaW1lLCBjb25zb2xlKSwgdGltZW91dFRpbWUpO1xuICAgIH0pO1xuXG4gICAgaXNTdGFibGVQcm9taXNlLmZpbmFsbHkoKCkgPT4gY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCkpO1xuICB9XG5cbiAgcmV0dXJuIGlzU3RhYmxlUHJvbWlzZS50aGVuKCgpID0+IHt9KTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgc2V0IG9mIHByb3ZpZGVycyByZXF1aXJlZCB0byBzZXR1cCBoeWRyYXRpb24gc3VwcG9ydFxuICogZm9yIGFuIGFwcGxpY2F0aW9uIHRoYXQgaXMgc2VydmVyIHNpZGUgcmVuZGVyZWQuIFRoaXMgZnVuY3Rpb24gaXNcbiAqIGluY2x1ZGVkIGludG8gdGhlIGBwcm92aWRlQ2xpZW50SHlkcmF0aW9uYCBwdWJsaWMgQVBJIGZ1bmN0aW9uIGZyb21cbiAqIHRoZSBgcGxhdGZvcm0tYnJvd3NlcmAgcGFja2FnZS5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gc2V0cyB1cCBhbiBpbnRlcm5hbCBmbGFnIHRoYXQgd291bGQgYmUgcmVjb2duaXplZCBkdXJpbmdcbiAqIHRoZSBzZXJ2ZXIgc2lkZSByZW5kZXJpbmcgdGltZSBhcyB3ZWxsLCBzbyB0aGVyZSBpcyBubyBuZWVkIHRvXG4gKiBjb25maWd1cmUgb3IgY2hhbmdlIGFueXRoaW5nIGluIE5nVW5pdmVyc2FsIHRvIGVuYWJsZSB0aGUgZmVhdHVyZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhEb21IeWRyYXRpb24oKTogRW52aXJvbm1lbnRQcm92aWRlcnMge1xuICByZXR1cm4gbWFrZUVudmlyb25tZW50UHJvdmlkZXJzKFtcbiAgICB7XG4gICAgICBwcm92aWRlOiBJU19IWURSQVRJT05fRE9NX1JFVVNFX0VOQUJMRUQsXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgIGxldCBpc0VuYWJsZWQgPSB0cnVlO1xuICAgICAgICBpZiAoaXNQbGF0Zm9ybUJyb3dzZXIoKSkge1xuICAgICAgICAgIC8vIE9uIHRoZSBjbGllbnQsIHZlcmlmeSB0aGF0IHRoZSBzZXJ2ZXIgcmVzcG9uc2UgY29udGFpbnNcbiAgICAgICAgICAvLyBoeWRyYXRpb24gYW5ub3RhdGlvbnMuIE90aGVyd2lzZSwga2VlcCBoeWRyYXRpb24gZGlzYWJsZWQuXG4gICAgICAgICAgY29uc3QgdHJhbnNmZXJTdGF0ZSA9IGluamVjdChUcmFuc2ZlclN0YXRlLCB7b3B0aW9uYWw6IHRydWV9KTtcbiAgICAgICAgICBpc0VuYWJsZWQgPSAhIXRyYW5zZmVyU3RhdGU/LmdldChOR0hfREFUQV9LRVksIG51bGwpO1xuICAgICAgICAgIGlmICghaXNFbmFibGVkICYmICh0eXBlb2YgbmdEZXZNb2RlICE9PSAndW5kZWZpbmVkJyAmJiBuZ0Rldk1vZGUpKSB7XG4gICAgICAgICAgICBjb25zdCBjb25zb2xlID0gaW5qZWN0KENvbnNvbGUpO1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IGZvcm1hdFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLk1JU1NJTkdfSFlEUkFUSU9OX0FOTk9UQVRJT05TLFxuICAgICAgICAgICAgICAgICdBbmd1bGFyIGh5ZHJhdGlvbiB3YXMgcmVxdWVzdGVkIG9uIHRoZSBjbGllbnQsIGJ1dCB0aGVyZSB3YXMgbm8gJyArXG4gICAgICAgICAgICAgICAgICAgICdzZXJpYWxpemVkIGluZm9ybWF0aW9uIHByZXNlbnQgaW4gdGhlIHNlcnZlciByZXNwb25zZSwgJyArXG4gICAgICAgICAgICAgICAgICAgICd0aHVzIGh5ZHJhdGlvbiB3YXMgbm90IGVuYWJsZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnTWFrZSBzdXJlIHRoZSBgcHJvdmlkZUNsaWVudEh5ZHJhdGlvbigpYCBpcyBpbmNsdWRlZCBpbnRvIHRoZSBsaXN0ICcgK1xuICAgICAgICAgICAgICAgICAgICAnb2YgcHJvdmlkZXJzIGluIHRoZSBzZXJ2ZXIgcGFydCBvZiB0aGUgYXBwbGljYXRpb24gY29uZmlndXJhdGlvbi4nKTtcbiAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1jb25zb2xlXG4gICAgICAgICAgICBjb25zb2xlLndhcm4obWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChpc0VuYWJsZWQpIHtcbiAgICAgICAgICBpbmplY3QoRU5BQkxFRF9TU1JfRkVBVFVSRVMpLmFkZCgnaHlkcmF0aW9uJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlzRW5hYmxlZDtcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBFTlZJUk9OTUVOVF9JTklUSUFMSVpFUixcbiAgICAgIHVzZVZhbHVlOiAoKSA9PiB7XG4gICAgICAgIC8vIFNpbmNlIHRoaXMgZnVuY3Rpb24gaXMgdXNlZCBhY3Jvc3MgYm90aCBzZXJ2ZXIgYW5kIGNsaWVudCxcbiAgICAgICAgLy8gbWFrZSBzdXJlIHRoYXQgdGhlIHJ1bnRpbWUgY29kZSBpcyBvbmx5IGFkZGVkIHdoZW4gaW52b2tlZFxuICAgICAgICAvLyBvbiB0aGUgY2xpZW50LiBNb3ZpbmcgZm9yd2FyZCwgdGhlIGBpc1BsYXRmb3JtQnJvd3NlcmAgY2hlY2sgc2hvdWxkXG4gICAgICAgIC8vIGJlIHJlcGxhY2VkIHdpdGggYSB0cmVlLXNoYWthYmxlIGFsdGVybmF0aXZlIChlLmcuIGBpc1NlcnZlcmBcbiAgICAgICAgLy8gZmxhZykuXG4gICAgICAgIGlmIChpc1BsYXRmb3JtQnJvd3NlcigpICYmIGluamVjdChJU19IWURSQVRJT05fRE9NX1JFVVNFX0VOQUJMRUQpKSB7XG4gICAgICAgICAgdmVyaWZ5U3NyQ29udGVudHNJbnRlZ3JpdHkoKTtcbiAgICAgICAgICBlbmFibGVIeWRyYXRpb25SdW50aW1lU3VwcG9ydCgpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgfSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBQUkVTRVJWRV9IT1NUX0NPTlRFTlQsXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgIC8vIFByZXNlcnZlIGhvc3QgZWxlbWVudCBjb250ZW50IG9ubHkgaW4gYSBicm93c2VyXG4gICAgICAgIC8vIGVudmlyb25tZW50IGFuZCB3aGVuIGh5ZHJhdGlvbiBpcyBjb25maWd1cmVkIHByb3Blcmx5LlxuICAgICAgICAvLyBPbiBhIHNlcnZlciwgYW4gYXBwbGljYXRpb24gaXMgcmVuZGVyZWQgZnJvbSBzY3JhdGNoLFxuICAgICAgICAvLyBzbyB0aGUgaG9zdCBjb250ZW50IG5lZWRzIHRvIGJlIGVtcHR5LlxuICAgICAgICByZXR1cm4gaXNQbGF0Zm9ybUJyb3dzZXIoKSAmJiBpbmplY3QoSVNfSFlEUkFUSU9OX0RPTV9SRVVTRV9FTkFCTEVEKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IEFQUF9CT09UU1RSQVBfTElTVEVORVIsXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgIGlmIChpc1BsYXRmb3JtQnJvd3NlcigpICYmIGluamVjdChJU19IWURSQVRJT05fRE9NX1JFVVNFX0VOQUJMRUQpKSB7XG4gICAgICAgICAgY29uc3QgYXBwUmVmID0gaW5qZWN0KEFwcGxpY2F0aW9uUmVmKTtcbiAgICAgICAgICBjb25zdCBpbmplY3RvciA9IGluamVjdChJbmplY3Rvcik7XG4gICAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIC8vIFdhaXQgdW50aWwgYW4gYXBwIGJlY29tZXMgc3RhYmxlIGFuZCBjbGVhbnVwIGFsbCB2aWV3cyB0aGF0XG4gICAgICAgICAgICAvLyB3ZXJlIG5vdCBjbGFpbWVkIGR1cmluZyB0aGUgYXBwbGljYXRpb24gYm9vdHN0cmFwIHByb2Nlc3MuXG4gICAgICAgICAgICAvLyBUaGUgdGltaW5nIGlzIHNpbWlsYXIgdG8gd2hlbiB3ZSBzdGFydCB0aGUgc2VyaWFsaXphdGlvbiBwcm9jZXNzXG4gICAgICAgICAgICAvLyBvbiB0aGUgc2VydmVyLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIE5vdGU6IHRoZSBjbGVhbnVwIHRhc2sgKk1VU1QqIGJlIHNjaGVkdWxlZCB3aXRoaW4gdGhlIEFuZ3VsYXIgem9uZVxuICAgICAgICAgICAgLy8gdG8gZW5zdXJlIHRoYXQgY2hhbmdlIGRldGVjdGlvbiBpcyBwcm9wZXJseSBydW4gYWZ0ZXJ3YXJkLlxuICAgICAgICAgICAgd2hlblN0YWJsZShhcHBSZWYsIGluamVjdG9yKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgTmdab25lLmFzc2VydEluQW5ndWxhclpvbmUoKTtcbiAgICAgICAgICAgICAgY2xlYW51cERlaHlkcmF0ZWRWaWV3cyhhcHBSZWYpO1xuXG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlICE9PSAndW5kZWZpbmVkJyAmJiBuZ0Rldk1vZGUpIHtcbiAgICAgICAgICAgICAgICBwcmludEh5ZHJhdGlvblN0YXRzKGluamVjdG9yKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKCkgPT4ge307ICAvLyBub29wXG4gICAgICB9LFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgfVxuICBdKTtcbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIHRpbWUgVGhlIHRpbWUgaW4gbXMgdW50aWwgdGhlIHN0YWJsZSB0aW1lZG91dCB3YXJuaW5nIG1lc3NhZ2UgaXMgbG9nZ2VkXG4gKi9cbmZ1bmN0aW9uIGxvZ1dhcm5pbmdPblN0YWJsZVRpbWVkb3V0KHRpbWU6IG51bWJlciwgY29uc29sZTogQ29uc29sZSk6IHZvaWQge1xuICBjb25zdCBtZXNzYWdlID1cbiAgICAgIGBBbmd1bGFyIGh5ZHJhdGlvbiBleHBlY3RlZCB0aGUgQXBwbGljYXRpb25SZWYuaXNTdGFibGUoKSB0byBlbWl0IFxcYHRydWVcXGAsIGJ1dCBpdCBgICtcbiAgICAgIGBkaWRuJ3QgaGFwcGVuIHdpdGhpbiAke1xuICAgICAgICAgIHRpbWV9bXMuIEFuZ3VsYXIgaHlkcmF0aW9uIGxvZ2ljIGRlcGVuZHMgb24gdGhlIGFwcGxpY2F0aW9uIGJlY29taW5nIHN0YWJsZSBgICtcbiAgICAgIGBhcyBhIHNpZ25hbCB0byBjb21wbGV0ZSBoeWRyYXRpb24gcHJvY2Vzcy5gO1xuXG4gIGNvbnNvbGUud2Fybihmb3JtYXRSdW50aW1lRXJyb3IoUnVudGltZUVycm9yQ29kZS5IWURSQVRJT05fU1RBQkxFX1RJTUVET1VULCBtZXNzYWdlKSk7XG59XG5cbi8qKlxuICogVmVyaWZpZXMgd2hldGhlciB0aGUgRE9NIGNvbnRhaW5zIGEgc3BlY2lhbCBtYXJrZXIgYWRkZWQgZHVyaW5nIFNTUiB0aW1lIHRvIG1ha2Ugc3VyZVxuICogdGhlcmUgaXMgbm8gU1NSJ2VkIGNvbnRlbnRzIHRyYW5zZm9ybWF0aW9ucyBoYXBwZW4gYWZ0ZXIgU1NSIGlzIGNvbXBsZXRlZC4gVHlwaWNhbGx5IHRoYXRcbiAqIGhhcHBlbnMgZWl0aGVyIGJ5IENETiBvciBkdXJpbmcgdGhlIGJ1aWxkIHByb2Nlc3MgYXMgYW4gb3B0aW1pemF0aW9uIHRvIHJlbW92ZSBjb21tZW50IG5vZGVzLlxuICogSHlkcmF0aW9uIHByb2Nlc3MgcmVxdWlyZXMgY29tbWVudCBub2RlcyBwcm9kdWNlZCBieSBBbmd1bGFyIHRvIGxvY2F0ZSBjb3JyZWN0IERPTSBzZWdtZW50cy5cbiAqIFdoZW4gdGhpcyBzcGVjaWFsIG1hcmtlciBpcyAqbm90KiBwcmVzZW50IC0gdGhyb3cgYW4gZXJyb3IgYW5kIGRvIG5vdCBwcm9jZWVkIHdpdGggaHlkcmF0aW9uLFxuICogc2luY2UgaXQgd2lsbCBub3QgYmUgYWJsZSB0byBmdW5jdGlvbiBjb3JyZWN0bHkuXG4gKlxuICogTm90ZTogdGhpcyBmdW5jdGlvbiBpcyBpbnZva2VkIG9ubHkgb24gdGhlIGNsaWVudCwgc28gaXQncyBzYWZlIHRvIHVzZSBET00gQVBJcy5cbiAqL1xuZnVuY3Rpb24gdmVyaWZ5U3NyQ29udGVudHNJbnRlZ3JpdHkoKTogdm9pZCB7XG4gIGNvbnN0IGRvYyA9IGdldERvY3VtZW50KCk7XG4gIGxldCBoeWRyYXRpb25NYXJrZXI6IE5vZGV8dW5kZWZpbmVkO1xuICBmb3IgKGNvbnN0IG5vZGUgb2YgZG9jLmJvZHkuY2hpbGROb2Rlcykge1xuICAgIGlmIChub2RlLm5vZGVUeXBlID09PSBOb2RlLkNPTU1FTlRfTk9ERSAmJlxuICAgICAgICBub2RlLnRleHRDb250ZW50Py50cmltKCkgPT09IFNTUl9DT05URU5UX0lOVEVHUklUWV9NQVJLRVIpIHtcbiAgICAgIGh5ZHJhdGlvbk1hcmtlciA9IG5vZGU7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgaWYgKCFoeWRyYXRpb25NYXJrZXIpIHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICBSdW50aW1lRXJyb3JDb2RlLk1JU1NJTkdfU1NSX0NPTlRFTlRfSU5URUdSSVRZX01BUktFUixcbiAgICAgICAgdHlwZW9mIG5nRGV2TW9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAnQW5ndWxhciBoeWRyYXRpb24gbG9naWMgZGV0ZWN0ZWQgdGhhdCBIVE1MIGNvbnRlbnQgb2YgdGhpcyBwYWdlIHdhcyBtb2RpZmllZCBhZnRlciBpdCAnICtcbiAgICAgICAgICAgICAgICAnd2FzIHByb2R1Y2VkIGR1cmluZyBzZXJ2ZXIgc2lkZSByZW5kZXJpbmcuIE1ha2Ugc3VyZSB0aGF0IHRoZXJlIGFyZSBubyBvcHRpbWl6YXRpb25zICcgK1xuICAgICAgICAgICAgICAgICd0aGF0IHJlbW92ZSBjb21tZW50IG5vZGVzIGZyb20gSFRNTCBlbmFibGVkIG9uIHlvdXIgQ0ROLiBBbmd1bGFyIGh5ZHJhdGlvbiAnICtcbiAgICAgICAgICAgICAgICAncmVsaWVzIG9uIEhUTUwgcHJvZHVjZWQgYnkgdGhlIHNlcnZlciwgaW5jbHVkaW5nIHdoaXRlc3BhY2VzIGFuZCBjb21tZW50IG5vZGVzLicpO1xuICB9XG59XG4iXX0=