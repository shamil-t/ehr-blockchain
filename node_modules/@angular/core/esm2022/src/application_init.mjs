import { inject, Injectable, InjectionToken } from './di';
import { RuntimeError } from './errors';
import { isPromise, isSubscribable } from './util/lang';
import * as i0 from "./r3_symbols";
/**
 * A [DI token](guide/glossary#di-token "DI token definition") that you can use to provide
 * one or more initialization functions.
 *
 * The provided functions are injected at application startup and executed during
 * app initialization. If any of these functions returns a Promise or an Observable, initialization
 * does not complete until the Promise is resolved or the Observable is completed.
 *
 * You can, for example, create a factory function that loads language data
 * or an external configuration, and provide that function to the `APP_INITIALIZER` token.
 * The function is executed during the application bootstrap process,
 * and the needed data is available on startup.
 *
 * @see {@link ApplicationInitStatus}
 *
 * @usageNotes
 *
 * The following example illustrates how to configure a multi-provider using `APP_INITIALIZER` token
 * and a function returning a promise.
 * ### Example with NgModule-based application
 * ```
 *  function initializeApp(): Promise<any> {
 *    return new Promise((resolve, reject) => {
 *      // Do some asynchronous stuff
 *      resolve();
 *    });
 *  }
 *
 *  @NgModule({
 *   imports: [BrowserModule],
 *   declarations: [AppComponent],
 *   bootstrap: [AppComponent],
 *   providers: [{
 *     provide: APP_INITIALIZER,
 *     useFactory: () => initializeApp,
 *     multi: true
 *    }]
 *   })
 *  export class AppModule {}
 * ```
 *
 * ### Example with standalone application
 * ```
 * export function initializeApp(http: HttpClient) {
 *   return (): Promise<any> =>
 *     firstValueFrom(
 *       http
 *         .get("https://someUrl.com/api/user")
 *         .pipe(tap(user => { ... }))
 *     );
 * }
 *
 * bootstrapApplication(App, {
 *   providers: [
 *     provideHttpClient(),
 *     {
 *       provide: APP_INITIALIZER,
 *       useFactory: initializeApp,
 *       multi: true,
 *       deps: [HttpClient],
 *     },
 *   ],
 * });

 * ```
 *
 *
 * It's also possible to configure a multi-provider using `APP_INITIALIZER` token and a function
 * returning an observable, see an example below. Note: the `HttpClient` in this example is used for
 * demo purposes to illustrate how the factory function can work with other providers available
 * through DI.
 *
 * ### Example with NgModule-based application
 * ```
 *  function initializeAppFactory(httpClient: HttpClient): () => Observable<any> {
 *   return () => httpClient.get("https://someUrl.com/api/user")
 *     .pipe(
 *        tap(user => { ... })
 *     );
 *  }
 *
 *  @NgModule({
 *    imports: [BrowserModule, HttpClientModule],
 *    declarations: [AppComponent],
 *    bootstrap: [AppComponent],
 *    providers: [{
 *      provide: APP_INITIALIZER,
 *      useFactory: initializeAppFactory,
 *      deps: [HttpClient],
 *      multi: true
 *    }]
 *  })
 *  export class AppModule {}
 * ```
 *
 * ### Example with standalone application
 * ```
 *  function initializeAppFactory(httpClient: HttpClient): () => Observable<any> {
 *   return () => httpClient.get("https://someUrl.com/api/user")
 *     .pipe(
 *        tap(user => { ... })
 *     );
 *  }
 *
 * bootstrapApplication(App, {
 *   providers: [
 *     provideHttpClient(),
 *     {
 *       provide: APP_INITIALIZER,
 *       useFactory: initializeApp,
 *       multi: true,
 *       deps: [HttpClient],
 *     },
 *   ],
 * });
 * ```
 *
 * @publicApi
 */
export const APP_INITIALIZER = new InjectionToken('Application Initializer');
/**
 * A class that reflects the state of running {@link APP_INITIALIZER} functions.
 *
 * @publicApi
 */
export class ApplicationInitStatus {
    constructor() {
        this.initialized = false;
        this.done = false;
        this.donePromise = new Promise((res, rej) => {
            this.resolve = res;
            this.reject = rej;
        });
        this.appInits = inject(APP_INITIALIZER, { optional: true }) ?? [];
        if ((typeof ngDevMode === 'undefined' || ngDevMode) && !Array.isArray(this.appInits)) {
            throw new RuntimeError(-209 /* RuntimeErrorCode.INVALID_MULTI_PROVIDER */, 'Unexpected type of the `APP_INITIALIZER` token value ' +
                `(expected an array, but got ${typeof this.appInits}). ` +
                'Please check that the `APP_INITIALIZER` token is configured as a ' +
                '`multi: true` provider.');
        }
    }
    /** @internal */
    runInitializers() {
        if (this.initialized) {
            return;
        }
        const asyncInitPromises = [];
        for (const appInits of this.appInits) {
            const initResult = appInits();
            if (isPromise(initResult)) {
                asyncInitPromises.push(initResult);
            }
            else if (isSubscribable(initResult)) {
                const observableAsPromise = new Promise((resolve, reject) => {
                    initResult.subscribe({ complete: resolve, error: reject });
                });
                asyncInitPromises.push(observableAsPromise);
            }
        }
        const complete = () => {
            // @ts-expect-error overwriting a readonly
            this.done = true;
            this.resolve();
        };
        Promise.all(asyncInitPromises)
            .then(() => {
            complete();
        })
            .catch(e => {
            this.reject(e);
        });
        if (asyncInitPromises.length === 0) {
            complete();
        }
        this.initialized = true;
    }
    static { this.ɵfac = function ApplicationInitStatus_Factory(t) { return new (t || ApplicationInitStatus)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: ApplicationInitStatus, factory: ApplicationInitStatus.ɵfac, providedIn: 'root' }); }
}
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(ApplicationInitStatus, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], function () { return []; }, null); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25faW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2FwcGxpY2F0aW9uX2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBVUEsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3hELE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sVUFBVSxDQUFDO0FBQ3hELE9BQU8sRUFBQyxTQUFTLEVBQUUsY0FBYyxFQUFDLE1BQU0sYUFBYSxDQUFDOztBQUV0RDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNIRztBQUNILE1BQU0sQ0FBQyxNQUFNLGVBQWUsR0FDeEIsSUFBSSxjQUFjLENBQ2QseUJBQXlCLENBQUMsQ0FBQztBQUVuQzs7OztHQUlHO0FBRUgsTUFBTSxPQUFPLHFCQUFxQjtJQWVoQztRQVRRLGdCQUFXLEdBQUcsS0FBSyxDQUFDO1FBQ1osU0FBSSxHQUFHLEtBQUssQ0FBQztRQUNiLGdCQUFXLEdBQWlCLElBQUksT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBQ25FLElBQUksQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO1lBQ25CLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQ3BCLENBQUMsQ0FBQyxDQUFDO1FBRWMsYUFBUSxHQUFHLE1BQU0sQ0FBQyxlQUFlLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFHMUUsSUFBSSxDQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ3BGLE1BQU0sSUFBSSxZQUFZLHFEQUVsQix1REFBdUQ7Z0JBQ25ELCtCQUErQixPQUFPLElBQUksQ0FBQyxRQUFRLEtBQUs7Z0JBQ3hELG1FQUFtRTtnQkFDbkUseUJBQXlCLENBQUMsQ0FBQztTQUNwQztJQUNILENBQUM7SUFFRCxnQkFBZ0I7SUFDaEIsZUFBZTtRQUNiLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNwQixPQUFPO1NBQ1I7UUFFRCxNQUFNLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztRQUM3QixLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDcEMsTUFBTSxVQUFVLEdBQUcsUUFBUSxFQUFFLENBQUM7WUFDOUIsSUFBSSxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQ3pCLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUNwQztpQkFBTSxJQUFJLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDckMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLE9BQU8sQ0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtvQkFDaEUsVUFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBQyxDQUFDLENBQUM7Z0JBQzNELENBQUMsQ0FBQyxDQUFDO2dCQUNILGlCQUFpQixDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2FBQzdDO1NBQ0Y7UUFFRCxNQUFNLFFBQVEsR0FBRyxHQUFHLEVBQUU7WUFDcEIsMENBQTBDO1lBQzFDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDLENBQUM7UUFFRixPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDO2FBQ3pCLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDVCxRQUFRLEVBQUUsQ0FBQztRQUNiLENBQUMsQ0FBQzthQUNELEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNULElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakIsQ0FBQyxDQUFDLENBQUM7UUFFUCxJQUFJLGlCQUFpQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDbEMsUUFBUSxFQUFFLENBQUM7U0FDWjtRQUNELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0lBQzFCLENBQUM7c0ZBL0RVLHFCQUFxQjt1RUFBckIscUJBQXFCLFdBQXJCLHFCQUFxQixtQkFEVCxNQUFNOztzRkFDbEIscUJBQXFCO2NBRGpDLFVBQVU7ZUFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtpbmplY3QsIEluamVjdGFibGUsIEluamVjdGlvblRva2VufSBmcm9tICcuL2RpJztcbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge2lzUHJvbWlzZSwgaXNTdWJzY3JpYmFibGV9IGZyb20gJy4vdXRpbC9sYW5nJztcblxuLyoqXG4gKiBBIFtESSB0b2tlbl0oZ3VpZGUvZ2xvc3NhcnkjZGktdG9rZW4gXCJESSB0b2tlbiBkZWZpbml0aW9uXCIpIHRoYXQgeW91IGNhbiB1c2UgdG8gcHJvdmlkZVxuICogb25lIG9yIG1vcmUgaW5pdGlhbGl6YXRpb24gZnVuY3Rpb25zLlxuICpcbiAqIFRoZSBwcm92aWRlZCBmdW5jdGlvbnMgYXJlIGluamVjdGVkIGF0IGFwcGxpY2F0aW9uIHN0YXJ0dXAgYW5kIGV4ZWN1dGVkIGR1cmluZ1xuICogYXBwIGluaXRpYWxpemF0aW9uLiBJZiBhbnkgb2YgdGhlc2UgZnVuY3Rpb25zIHJldHVybnMgYSBQcm9taXNlIG9yIGFuIE9ic2VydmFibGUsIGluaXRpYWxpemF0aW9uXG4gKiBkb2VzIG5vdCBjb21wbGV0ZSB1bnRpbCB0aGUgUHJvbWlzZSBpcyByZXNvbHZlZCBvciB0aGUgT2JzZXJ2YWJsZSBpcyBjb21wbGV0ZWQuXG4gKlxuICogWW91IGNhbiwgZm9yIGV4YW1wbGUsIGNyZWF0ZSBhIGZhY3RvcnkgZnVuY3Rpb24gdGhhdCBsb2FkcyBsYW5ndWFnZSBkYXRhXG4gKiBvciBhbiBleHRlcm5hbCBjb25maWd1cmF0aW9uLCBhbmQgcHJvdmlkZSB0aGF0IGZ1bmN0aW9uIHRvIHRoZSBgQVBQX0lOSVRJQUxJWkVSYCB0b2tlbi5cbiAqIFRoZSBmdW5jdGlvbiBpcyBleGVjdXRlZCBkdXJpbmcgdGhlIGFwcGxpY2F0aW9uIGJvb3RzdHJhcCBwcm9jZXNzLFxuICogYW5kIHRoZSBuZWVkZWQgZGF0YSBpcyBhdmFpbGFibGUgb24gc3RhcnR1cC5cbiAqXG4gKiBAc2VlIHtAbGluayBBcHBsaWNhdGlvbkluaXRTdGF0dXN9XG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgaWxsdXN0cmF0ZXMgaG93IHRvIGNvbmZpZ3VyZSBhIG11bHRpLXByb3ZpZGVyIHVzaW5nIGBBUFBfSU5JVElBTElaRVJgIHRva2VuXG4gKiBhbmQgYSBmdW5jdGlvbiByZXR1cm5pbmcgYSBwcm9taXNlLlxuICogIyMjIEV4YW1wbGUgd2l0aCBOZ01vZHVsZS1iYXNlZCBhcHBsaWNhdGlvblxuICogYGBgXG4gKiAgZnVuY3Rpb24gaW5pdGlhbGl6ZUFwcCgpOiBQcm9taXNlPGFueT4ge1xuICogICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAqICAgICAgLy8gRG8gc29tZSBhc3luY2hyb25vdXMgc3R1ZmZcbiAqICAgICAgcmVzb2x2ZSgpO1xuICogICAgfSk7XG4gKiAgfVxuICpcbiAqICBATmdNb2R1bGUoe1xuICogICBpbXBvcnRzOiBbQnJvd3Nlck1vZHVsZV0sXG4gKiAgIGRlY2xhcmF0aW9uczogW0FwcENvbXBvbmVudF0sXG4gKiAgIGJvb3RzdHJhcDogW0FwcENvbXBvbmVudF0sXG4gKiAgIHByb3ZpZGVyczogW3tcbiAqICAgICBwcm92aWRlOiBBUFBfSU5JVElBTElaRVIsXG4gKiAgICAgdXNlRmFjdG9yeTogKCkgPT4gaW5pdGlhbGl6ZUFwcCxcbiAqICAgICBtdWx0aTogdHJ1ZVxuICogICAgfV1cbiAqICAgfSlcbiAqICBleHBvcnQgY2xhc3MgQXBwTW9kdWxlIHt9XG4gKiBgYGBcbiAqXG4gKiAjIyMgRXhhbXBsZSB3aXRoIHN0YW5kYWxvbmUgYXBwbGljYXRpb25cbiAqIGBgYFxuICogZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemVBcHAoaHR0cDogSHR0cENsaWVudCkge1xuICogICByZXR1cm4gKCk6IFByb21pc2U8YW55PiA9PlxuICogICAgIGZpcnN0VmFsdWVGcm9tKFxuICogICAgICAgaHR0cFxuICogICAgICAgICAuZ2V0KFwiaHR0cHM6Ly9zb21lVXJsLmNvbS9hcGkvdXNlclwiKVxuICogICAgICAgICAucGlwZSh0YXAodXNlciA9PiB7IC4uLiB9KSlcbiAqICAgICApO1xuICogfVxuICpcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKEFwcCwge1xuICogICBwcm92aWRlcnM6IFtcbiAqICAgICBwcm92aWRlSHR0cENsaWVudCgpLFxuICogICAgIHtcbiAqICAgICAgIHByb3ZpZGU6IEFQUF9JTklUSUFMSVpFUixcbiAqICAgICAgIHVzZUZhY3Rvcnk6IGluaXRpYWxpemVBcHAsXG4gKiAgICAgICBtdWx0aTogdHJ1ZSxcbiAqICAgICAgIGRlcHM6IFtIdHRwQ2xpZW50XSxcbiAqICAgICB9LFxuICogICBdLFxuICogfSk7XG5cbiAqIGBgYFxuICpcbiAqXG4gKiBJdCdzIGFsc28gcG9zc2libGUgdG8gY29uZmlndXJlIGEgbXVsdGktcHJvdmlkZXIgdXNpbmcgYEFQUF9JTklUSUFMSVpFUmAgdG9rZW4gYW5kIGEgZnVuY3Rpb25cbiAqIHJldHVybmluZyBhbiBvYnNlcnZhYmxlLCBzZWUgYW4gZXhhbXBsZSBiZWxvdy4gTm90ZTogdGhlIGBIdHRwQ2xpZW50YCBpbiB0aGlzIGV4YW1wbGUgaXMgdXNlZCBmb3JcbiAqIGRlbW8gcHVycG9zZXMgdG8gaWxsdXN0cmF0ZSBob3cgdGhlIGZhY3RvcnkgZnVuY3Rpb24gY2FuIHdvcmsgd2l0aCBvdGhlciBwcm92aWRlcnMgYXZhaWxhYmxlXG4gKiB0aHJvdWdoIERJLlxuICpcbiAqICMjIyBFeGFtcGxlIHdpdGggTmdNb2R1bGUtYmFzZWQgYXBwbGljYXRpb25cbiAqIGBgYFxuICogIGZ1bmN0aW9uIGluaXRpYWxpemVBcHBGYWN0b3J5KGh0dHBDbGllbnQ6IEh0dHBDbGllbnQpOiAoKSA9PiBPYnNlcnZhYmxlPGFueT4ge1xuICogICByZXR1cm4gKCkgPT4gaHR0cENsaWVudC5nZXQoXCJodHRwczovL3NvbWVVcmwuY29tL2FwaS91c2VyXCIpXG4gKiAgICAgLnBpcGUoXG4gKiAgICAgICAgdGFwKHVzZXIgPT4geyAuLi4gfSlcbiAqICAgICApO1xuICogIH1cbiAqXG4gKiAgQE5nTW9kdWxlKHtcbiAqICAgIGltcG9ydHM6IFtCcm93c2VyTW9kdWxlLCBIdHRwQ2xpZW50TW9kdWxlXSxcbiAqICAgIGRlY2xhcmF0aW9uczogW0FwcENvbXBvbmVudF0sXG4gKiAgICBib290c3RyYXA6IFtBcHBDb21wb25lbnRdLFxuICogICAgcHJvdmlkZXJzOiBbe1xuICogICAgICBwcm92aWRlOiBBUFBfSU5JVElBTElaRVIsXG4gKiAgICAgIHVzZUZhY3Rvcnk6IGluaXRpYWxpemVBcHBGYWN0b3J5LFxuICogICAgICBkZXBzOiBbSHR0cENsaWVudF0sXG4gKiAgICAgIG11bHRpOiB0cnVlXG4gKiAgICB9XVxuICogIH0pXG4gKiAgZXhwb3J0IGNsYXNzIEFwcE1vZHVsZSB7fVxuICogYGBgXG4gKlxuICogIyMjIEV4YW1wbGUgd2l0aCBzdGFuZGFsb25lIGFwcGxpY2F0aW9uXG4gKiBgYGBcbiAqICBmdW5jdGlvbiBpbml0aWFsaXplQXBwRmFjdG9yeShodHRwQ2xpZW50OiBIdHRwQ2xpZW50KTogKCkgPT4gT2JzZXJ2YWJsZTxhbnk+IHtcbiAqICAgcmV0dXJuICgpID0+IGh0dHBDbGllbnQuZ2V0KFwiaHR0cHM6Ly9zb21lVXJsLmNvbS9hcGkvdXNlclwiKVxuICogICAgIC5waXBlKFxuICogICAgICAgIHRhcCh1c2VyID0+IHsgLi4uIH0pXG4gKiAgICAgKTtcbiAqICB9XG4gKlxuICogYm9vdHN0cmFwQXBwbGljYXRpb24oQXBwLCB7XG4gKiAgIHByb3ZpZGVyczogW1xuICogICAgIHByb3ZpZGVIdHRwQ2xpZW50KCksXG4gKiAgICAge1xuICogICAgICAgcHJvdmlkZTogQVBQX0lOSVRJQUxJWkVSLFxuICogICAgICAgdXNlRmFjdG9yeTogaW5pdGlhbGl6ZUFwcCxcbiAqICAgICAgIG11bHRpOiB0cnVlLFxuICogICAgICAgZGVwczogW0h0dHBDbGllbnRdLFxuICogICAgIH0sXG4gKiAgIF0sXG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IEFQUF9JTklUSUFMSVpFUiA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPFJlYWRvbmx5QXJyYXk8KCkgPT4gT2JzZXJ2YWJsZTx1bmtub3duPnwgUHJvbWlzZTx1bmtub3duPnwgdm9pZD4+KFxuICAgICAgICAnQXBwbGljYXRpb24gSW5pdGlhbGl6ZXInKTtcblxuLyoqXG4gKiBBIGNsYXNzIHRoYXQgcmVmbGVjdHMgdGhlIHN0YXRlIG9mIHJ1bm5pbmcge0BsaW5rIEFQUF9JTklUSUFMSVpFUn0gZnVuY3Rpb25zLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb25Jbml0U3RhdHVzIHtcbiAgLy8gVXNpbmcgbm9uIG51bGwgYXNzZXJ0aW9uLCB0aGVzZSBmaWVsZHMgYXJlIGRlZmluZWQgYmVsb3dcbiAgLy8gd2l0aGluIHRoZSBgbmV3IFByb21pc2VgIGNhbGxiYWNrIChzeW5jaHJvbm91c2x5KS5cbiAgcHJpdmF0ZSByZXNvbHZlITogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkO1xuICBwcml2YXRlIHJlamVjdCE6ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZDtcblxuICBwcml2YXRlIGluaXRpYWxpemVkID0gZmFsc2U7XG4gIHB1YmxpYyByZWFkb25seSBkb25lID0gZmFsc2U7XG4gIHB1YmxpYyByZWFkb25seSBkb25lUHJvbWlzZTogUHJvbWlzZTxhbnk+ID0gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgdGhpcy5yZXNvbHZlID0gcmVzO1xuICAgIHRoaXMucmVqZWN0ID0gcmVqO1xuICB9KTtcblxuICBwcml2YXRlIHJlYWRvbmx5IGFwcEluaXRzID0gaW5qZWN0KEFQUF9JTklUSUFMSVpFUiwge29wdGlvbmFsOiB0cnVlfSkgPz8gW107XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmICFBcnJheS5pc0FycmF5KHRoaXMuYXBwSW5pdHMpKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuSU5WQUxJRF9NVUxUSV9QUk9WSURFUixcbiAgICAgICAgICAnVW5leHBlY3RlZCB0eXBlIG9mIHRoZSBgQVBQX0lOSVRJQUxJWkVSYCB0b2tlbiB2YWx1ZSAnICtcbiAgICAgICAgICAgICAgYChleHBlY3RlZCBhbiBhcnJheSwgYnV0IGdvdCAke3R5cGVvZiB0aGlzLmFwcEluaXRzfSkuIGAgK1xuICAgICAgICAgICAgICAnUGxlYXNlIGNoZWNrIHRoYXQgdGhlIGBBUFBfSU5JVElBTElaRVJgIHRva2VuIGlzIGNvbmZpZ3VyZWQgYXMgYSAnICtcbiAgICAgICAgICAgICAgJ2BtdWx0aTogdHJ1ZWAgcHJvdmlkZXIuJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBydW5Jbml0aWFsaXplcnMoKSB7XG4gICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhc3luY0luaXRQcm9taXNlcyA9IFtdO1xuICAgIGZvciAoY29uc3QgYXBwSW5pdHMgb2YgdGhpcy5hcHBJbml0cykge1xuICAgICAgY29uc3QgaW5pdFJlc3VsdCA9IGFwcEluaXRzKCk7XG4gICAgICBpZiAoaXNQcm9taXNlKGluaXRSZXN1bHQpKSB7XG4gICAgICAgIGFzeW5jSW5pdFByb21pc2VzLnB1c2goaW5pdFJlc3VsdCk7XG4gICAgICB9IGVsc2UgaWYgKGlzU3Vic2NyaWJhYmxlKGluaXRSZXN1bHQpKSB7XG4gICAgICAgIGNvbnN0IG9ic2VydmFibGVBc1Byb21pc2UgPSBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgaW5pdFJlc3VsdC5zdWJzY3JpYmUoe2NvbXBsZXRlOiByZXNvbHZlLCBlcnJvcjogcmVqZWN0fSk7XG4gICAgICAgIH0pO1xuICAgICAgICBhc3luY0luaXRQcm9taXNlcy5wdXNoKG9ic2VydmFibGVBc1Byb21pc2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGNvbXBsZXRlID0gKCkgPT4ge1xuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBvdmVyd3JpdGluZyBhIHJlYWRvbmx5XG4gICAgICB0aGlzLmRvbmUgPSB0cnVlO1xuICAgICAgdGhpcy5yZXNvbHZlKCk7XG4gICAgfTtcblxuICAgIFByb21pc2UuYWxsKGFzeW5jSW5pdFByb21pc2VzKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgY29tcGxldGUoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGUgPT4ge1xuICAgICAgICAgIHRoaXMucmVqZWN0KGUpO1xuICAgICAgICB9KTtcblxuICAgIGlmIChhc3luY0luaXRQcm9taXNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbXBsZXRlKCk7XG4gICAgfVxuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICB9XG59XG4iXX0=