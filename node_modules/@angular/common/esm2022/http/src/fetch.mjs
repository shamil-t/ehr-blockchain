/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpHeaders } from './headers';
import { HttpErrorResponse, HttpEventType, HttpHeaderResponse, HttpResponse } from './response';
import * as i0 from "@angular/core";
const XSSI_PREFIX = /^\)\]\}',?\n/;
const REQUEST_URL_HEADER = `X-Request-URL`;
/**
 * Determine an appropriate URL for the response, by checking either
 * response url or the X-Request-URL header.
 */
function getResponseUrl(response) {
    if (response.url) {
        return response.url;
    }
    // stored as lowercase in the map
    const xRequestUrl = REQUEST_URL_HEADER.toLocaleLowerCase();
    return response.headers.get(xRequestUrl);
}
/**
 * Uses `fetch` to send requests to a backend server.
 *
 * This `FetchBackend` requires the support of the
 * [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) which is available on all
 * supported browsers and on Node.js v18 or later.
 *
 * @see {@link HttpHandler}
 *
 * @publicApi
 * @developerPreview
 */
export class FetchBackend {
    constructor() {
        // We need to bind the native fetch to its context or it will throw an "illegal invocation"
        this.fetchImpl = inject(FetchFactory, { optional: true })?.fetch ?? fetch.bind(globalThis);
        this.ngZone = inject(NgZone);
    }
    handle(request) {
        return new Observable(observer => {
            const aborter = new AbortController();
            this.doRequest(request, aborter.signal, observer)
                .then(noop, error => observer.error(new HttpErrorResponse({ error })));
            return () => aborter.abort();
        });
    }
    async doRequest(request, signal, observer) {
        const init = this.createRequestInit(request);
        let response;
        try {
            const fetchPromise = this.fetchImpl(request.urlWithParams, { signal, ...init });
            // Make sure Zone.js doesn't trigger false-positive unhandled promise
            // error in case the Promise is rejected synchronously. See function
            // description for additional information.
            silenceSuperfluousUnhandledPromiseRejection(fetchPromise);
            // Send the `Sent` event before awaiting the response.
            observer.next({ type: HttpEventType.Sent });
            response = await fetchPromise;
        }
        catch (error) {
            observer.error(new HttpErrorResponse({
                error,
                status: error.status ?? 0,
                statusText: error.statusText,
                url: request.urlWithParams,
                headers: error.headers,
            }));
            return;
        }
        const headers = new HttpHeaders(response.headers);
        const statusText = response.statusText;
        const url = getResponseUrl(response) ?? request.urlWithParams;
        let status = response.status;
        let body = null;
        if (request.reportProgress) {
            observer.next(new HttpHeaderResponse({ headers, status, statusText, url }));
        }
        if (response.body) {
            // Read Progress
            const contentLength = response.headers.get('content-length');
            const chunks = [];
            const reader = response.body.getReader();
            let receivedLength = 0;
            let decoder;
            let partialText;
            // We have to check whether the Zone is defined in the global scope because this may be called
            // when the zone is nooped.
            const reqZone = typeof Zone !== 'undefined' && Zone.current;
            // Perform response processing outside of Angular zone to
            // ensure no excessive change detection runs are executed
            // Here calling the async ReadableStreamDefaultReader.read() is responsible for triggering CD
            await this.ngZone.runOutsideAngular(async () => {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }
                    chunks.push(value);
                    receivedLength += value.length;
                    if (request.reportProgress) {
                        partialText = request.responseType === 'text' ?
                            (partialText ?? '') + (decoder ??= new TextDecoder).decode(value, { stream: true }) :
                            undefined;
                        const reportProgress = () => observer.next({
                            type: HttpEventType.DownloadProgress,
                            total: contentLength ? +contentLength : undefined,
                            loaded: receivedLength,
                            partialText,
                        });
                        reqZone ? reqZone.run(reportProgress) : reportProgress();
                    }
                }
            });
            // Combine all chunks.
            const chunksAll = this.concatChunks(chunks, receivedLength);
            try {
                body = this.parseBody(request, chunksAll);
            }
            catch (error) {
                // Body loading or parsing failed
                observer.error(new HttpErrorResponse({
                    error,
                    headers: new HttpHeaders(response.headers),
                    status: response.status,
                    statusText: response.statusText,
                    url: getResponseUrl(response) ?? request.urlWithParams,
                }));
                return;
            }
        }
        // Same behavior as the XhrBackend
        if (status === 0) {
            status = body ? 200 /* HttpStatusCode.Ok */ : 0;
        }
        // ok determines whether the response will be transmitted on the event or
        // error channel. Unsuccessful status codes (not 2xx) will always be errors,
        // but a successful status code can still result in an error if the user
        // asked for JSON data and the body cannot be parsed as such.
        const ok = status >= 200 && status < 300;
        if (ok) {
            observer.next(new HttpResponse({
                body,
                headers,
                status,
                statusText,
                url,
            }));
            // The full body has been received and delivered, no further events
            // are possible. This request is complete.
            observer.complete();
        }
        else {
            observer.error(new HttpErrorResponse({
                error: body,
                headers,
                status,
                statusText,
                url,
            }));
        }
    }
    parseBody(request, binContent) {
        switch (request.responseType) {
            case 'json':
                // stripping the XSSI when present
                const text = new TextDecoder().decode(binContent).replace(XSSI_PREFIX, '');
                return text === '' ? null : JSON.parse(text);
            case 'text':
                return new TextDecoder().decode(binContent);
            case 'blob':
                return new Blob([binContent]);
            case 'arraybuffer':
                return binContent.buffer;
        }
    }
    createRequestInit(req) {
        // We could share some of this logic with the XhrBackend
        const headers = {};
        const credentials = req.withCredentials ? 'include' : undefined;
        // Setting all the requested headers.
        req.headers.forEach((name, values) => (headers[name] = values.join(',')));
        // Add an Accept header if one isn't present already.
        headers['Accept'] ??= 'application/json, text/plain, */*';
        // Auto-detect the Content-Type header if one isn't present already.
        if (!headers['Content-Type']) {
            const detectedType = req.detectContentTypeHeader();
            // Sometimes Content-Type detection fails.
            if (detectedType !== null) {
                headers['Content-Type'] = detectedType;
            }
        }
        return {
            body: req.serializeBody(),
            method: req.method,
            headers,
            credentials,
        };
    }
    concatChunks(chunks, totalLength) {
        const chunksAll = new Uint8Array(totalLength);
        let position = 0;
        for (const chunk of chunks) {
            chunksAll.set(chunk, position);
            position += chunk.length;
        }
        return chunksAll;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: FetchBackend, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: FetchBackend }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: FetchBackend, decorators: [{
            type: Injectable
        }] });
/**
 * Abstract class to provide a mocked implementation of `fetch()`
 */
export class FetchFactory {
}
function noop() { }
/**
 * Zone.js treats a rejected promise that has not yet been awaited
 * as an unhandled error. This function adds a noop `.then` to make
 * sure that Zone.js doesn't throw an error if the Promise is rejected
 * synchronously.
 */
function silenceSuperfluousUnhandledPromiseRejection(promise) {
    promise.then(noop, noop);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmV0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21tb24vaHR0cC9zcmMvZmV0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3pELE9BQU8sRUFBQyxVQUFVLEVBQVcsTUFBTSxNQUFNLENBQUM7QUFHMUMsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUV0QyxPQUFPLEVBQTRCLGlCQUFpQixFQUFhLGFBQWEsRUFBRSxrQkFBa0IsRUFBRSxZQUFZLEVBQWlCLE1BQU0sWUFBWSxDQUFDOztBQUVwSixNQUFNLFdBQVcsR0FBRyxjQUFjLENBQUM7QUFFbkMsTUFBTSxrQkFBa0IsR0FBRyxlQUFlLENBQUM7QUFFM0M7OztHQUdHO0FBQ0gsU0FBUyxjQUFjLENBQUMsUUFBa0I7SUFDeEMsSUFBSSxRQUFRLENBQUMsR0FBRyxFQUFFO1FBQ2hCLE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQztLQUNyQjtJQUNELGlDQUFpQztJQUNqQyxNQUFNLFdBQVcsR0FBRyxrQkFBa0IsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0lBQzNELE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDM0MsQ0FBQztBQUVEOzs7Ozs7Ozs7OztHQVdHO0FBRUgsTUFBTSxPQUFPLFlBQVk7SUFEekI7UUFFRSwyRkFBMkY7UUFDMUUsY0FBUyxHQUN0QixNQUFNLENBQUMsWUFBWSxFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLEVBQUUsS0FBSyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDM0QsV0FBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztLQXlNMUM7SUF2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Q29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7aW5qZWN0LCBJbmplY3RhYmxlLCBOZ1pvbmV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBPYnNlcnZlcn0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7SHR0cEJhY2tlbmR9IGZyb20gJy4vYmFja2VuZCc7XG5pbXBvcnQge0h0dHBIZWFkZXJzfSBmcm9tICcuL2hlYWRlcnMnO1xuaW1wb3J0IHtIdHRwUmVxdWVzdH0gZnJvbSAnLi9yZXF1ZXN0JztcbmltcG9ydCB7SHR0cERvd25sb2FkUHJvZ3Jlc3NFdmVudCwgSHR0cEVycm9yUmVzcG9uc2UsIEh0dHBFdmVudCwgSHR0cEV2ZW50VHlwZSwgSHR0cEhlYWRlclJlc3BvbnNlLCBIdHRwUmVzcG9uc2UsIEh0dHBTdGF0dXNDb2RlfSBmcm9tICcuL3Jlc3BvbnNlJztcblxuY29uc3QgWFNTSV9QUkVGSVggPSAvXlxcKVxcXVxcfScsP1xcbi87XG5cbmNvbnN0IFJFUVVFU1RfVVJMX0hFQURFUiA9IGBYLVJlcXVlc3QtVVJMYDtcblxuLyoqXG4gKiBEZXRlcm1pbmUgYW4gYXBwcm9wcmlhdGUgVVJMIGZvciB0aGUgcmVzcG9uc2UsIGJ5IGNoZWNraW5nIGVpdGhlclxuICogcmVzcG9uc2UgdXJsIG9yIHRoZSBYLVJlcXVlc3QtVVJMIGhlYWRlci5cbiAqL1xuZnVuY3Rpb24gZ2V0UmVzcG9uc2VVcmwocmVzcG9uc2U6IFJlc3BvbnNlKTogc3RyaW5nfG51bGwge1xuICBpZiAocmVzcG9uc2UudXJsKSB7XG4gICAgcmV0dXJuIHJlc3BvbnNlLnVybDtcbiAgfVxuICAvLyBzdG9yZWQgYXMgbG93ZXJjYXNlIGluIHRoZSBtYXBcbiAgY29uc3QgeFJlcXVlc3RVcmwgPSBSRVFVRVNUX1VSTF9IRUFERVIudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgcmV0dXJuIHJlc3BvbnNlLmhlYWRlcnMuZ2V0KHhSZXF1ZXN0VXJsKTtcbn1cblxuLyoqXG4gKiBVc2VzIGBmZXRjaGAgdG8gc2VuZCByZXF1ZXN0cyB0byBhIGJhY2tlbmQgc2VydmVyLlxuICpcbiAqIFRoaXMgYEZldGNoQmFja2VuZGAgcmVxdWlyZXMgdGhlIHN1cHBvcnQgb2YgdGhlXG4gKiBbRmV0Y2ggQVBJXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRmV0Y2hfQVBJKSB3aGljaCBpcyBhdmFpbGFibGUgb24gYWxsXG4gKiBzdXBwb3J0ZWQgYnJvd3NlcnMgYW5kIG9uIE5vZGUuanMgdjE4IG9yIGxhdGVyLlxuICpcbiAqIEBzZWUge0BsaW5rIEh0dHBIYW5kbGVyfVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBGZXRjaEJhY2tlbmQgaW1wbGVtZW50cyBIdHRwQmFja2VuZCB7XG4gIC8vIFdlIG5lZWQgdG8gYmluZCB0aGUgbmF0aXZlIGZldGNoIHRvIGl0cyBjb250ZXh0IG9yIGl0IHdpbGwgdGhyb3cgYW4gXCJpbGxlZ2FsIGludm9jYXRpb25cIlxuICBwcml2YXRlIHJlYWRvbmx5IGZldGNoSW1wbCA9XG4gICAgICBpbmplY3QoRmV0Y2hGYWN0b3J5LCB7b3B0aW9uYWw6IHRydWV9KT8uZmV0Y2ggPz8gZmV0Y2guYmluZChnbG9iYWxUaGlzKTtcbiAgcHJpdmF0ZSByZWFkb25seSBuZ1pvbmUgPSBpbmplY3QoTmdab25lKTtcblxuICBoYW5kbGUocmVxdWVzdDogSHR0cFJlcXVlc3Q8YW55Pik6IE9ic2VydmFibGU8SHR0cEV2ZW50PGFueT4+IHtcbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGUob2JzZXJ2ZXIgPT4ge1xuICAgICAgY29uc3QgYWJvcnRlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICAgIHRoaXMuZG9SZXF1ZXN0KHJlcXVlc3QsIGFib3J0ZXIuc2lnbmFsLCBvYnNlcnZlcilcbiAgICAgICAgICAudGhlbihub29wLCBlcnJvciA9PiBvYnNlcnZlci5lcnJvcihuZXcgSHR0cEVycm9yUmVzcG9uc2Uoe2Vycm9yfSkpKTtcbiAgICAgIHJldHVybiAoKSA9PiBhYm9ydGVyLmFib3J0KCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGRvUmVxdWVzdChcbiAgICAgIHJlcXVlc3Q6IEh0dHBSZXF1ZXN0PGFueT4sIHNpZ25hbDogQWJvcnRTaWduYWwsXG4gICAgICBvYnNlcnZlcjogT2JzZXJ2ZXI8SHR0cEV2ZW50PGFueT4+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgaW5pdCA9IHRoaXMuY3JlYXRlUmVxdWVzdEluaXQocmVxdWVzdCk7XG4gICAgbGV0IHJlc3BvbnNlO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZldGNoUHJvbWlzZSA9IHRoaXMuZmV0Y2hJbXBsKHJlcXVlc3QudXJsV2l0aFBhcmFtcywge3NpZ25hbCwgLi4uaW5pdH0pO1xuXG4gICAgICAvLyBNYWtlIHN1cmUgWm9uZS5qcyBkb2Vzbid0IHRyaWdnZXIgZmFsc2UtcG9zaXRpdmUgdW5oYW5kbGVkIHByb21pc2VcbiAgICAgIC8vIGVycm9yIGluIGNhc2UgdGhlIFByb21pc2UgaXMgcmVqZWN0ZWQgc3luY2hyb25vdXNseS4gU2VlIGZ1bmN0aW9uXG4gICAgICAvLyBkZXNjcmlwdGlvbiBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvbi5cbiAgICAgIHNpbGVuY2VTdXBlcmZsdW91c1VuaGFuZGxlZFByb21pc2VSZWplY3Rpb24oZmV0Y2hQcm9taXNlKTtcblxuICAgICAgLy8gU2VuZCB0aGUgYFNlbnRgIGV2ZW50IGJlZm9yZSBhd2FpdGluZyB0aGUgcmVzcG9uc2UuXG4gICAgICBvYnNlcnZlci5uZXh0KHt0eXBlOiBIdHRwRXZlbnRUeXBlLlNlbnR9KTtcblxuICAgICAgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaFByb21pc2U7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgb2JzZXJ2ZXIuZXJyb3IobmV3IEh0dHBFcnJvclJlc3BvbnNlKHtcbiAgICAgICAgZXJyb3IsXG4gICAgICAgIHN0YXR1czogZXJyb3Iuc3RhdHVzID8/IDAsXG4gICAgICAgIHN0YXR1c1RleHQ6IGVycm9yLnN0YXR1c1RleHQsXG4gICAgICAgIHVybDogcmVxdWVzdC51cmxXaXRoUGFyYW1zLFxuICAgICAgICBoZWFkZXJzOiBlcnJvci5oZWFkZXJzLFxuICAgICAgfSkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRlcnMgPSBuZXcgSHR0cEhlYWRlcnMocmVzcG9uc2UuaGVhZGVycyk7XG4gICAgY29uc3Qgc3RhdHVzVGV4dCA9IHJlc3BvbnNlLnN0YXR1c1RleHQ7XG4gICAgY29uc3QgdXJsID0gZ2V0UmVzcG9uc2VVcmwocmVzcG9uc2UpID8/IHJlcXVlc3QudXJsV2l0aFBhcmFtcztcblxuICAgIGxldCBzdGF0dXMgPSByZXNwb25zZS5zdGF0dXM7XG4gICAgbGV0IGJvZHk6IHN0cmluZ3xBcnJheUJ1ZmZlcnxCbG9ifG9iamVjdHxudWxsID0gbnVsbDtcblxuICAgIGlmIChyZXF1ZXN0LnJlcG9ydFByb2dyZXNzKSB7XG4gICAgICBvYnNlcnZlci5uZXh0KG5ldyBIdHRwSGVhZGVyUmVzcG9uc2Uoe2hlYWRlcnMsIHN0YXR1cywgc3RhdHVzVGV4dCwgdXJsfSkpO1xuICAgIH1cblxuICAgIGlmIChyZXNwb25zZS5ib2R5KSB7XG4gICAgICAvLyBSZWFkIFByb2dyZXNzXG4gICAgICBjb25zdCBjb250ZW50TGVuZ3RoID0gcmVzcG9uc2UuaGVhZGVycy5nZXQoJ2NvbnRlbnQtbGVuZ3RoJyk7XG4gICAgICBjb25zdCBjaHVua3M6IFVpbnQ4QXJyYXlbXSA9IFtdO1xuICAgICAgY29uc3QgcmVhZGVyID0gcmVzcG9uc2UuYm9keS5nZXRSZWFkZXIoKTtcbiAgICAgIGxldCByZWNlaXZlZExlbmd0aCA9IDA7XG5cbiAgICAgIGxldCBkZWNvZGVyOiBUZXh0RGVjb2RlcjtcbiAgICAgIGxldCBwYXJ0aWFsVGV4dDogc3RyaW5nfHVuZGVmaW5lZDtcblxuICAgICAgLy8gV2UgaGF2ZSB0byBjaGVjayB3aGV0aGVyIHRoZSBab25lIGlzIGRlZmluZWQgaW4gdGhlIGdsb2JhbCBzY29wZSBiZWNhdXNlIHRoaXMgbWF5IGJlIGNhbGxlZFxuICAgICAgLy8gd2hlbiB0aGUgem9uZSBpcyBub29wZWQuXG4gICAgICBjb25zdCByZXFab25lID0gdHlwZW9mIFpvbmUgIT09ICd1bmRlZmluZWQnICYmIFpvbmUuY3VycmVudDtcblxuICAgICAgLy8gUGVyZm9ybSByZXNwb25zZSBwcm9jZXNzaW5nIG91dHNpZGUgb2YgQW5ndWxhciB6b25lIHRvXG4gICAgICAvLyBlbnN1cmUgbm8gZXhjZXNzaXZlIGNoYW5nZSBkZXRlY3Rpb24gcnVucyBhcmUgZXhlY3V0ZWRcbiAgICAgIC8vIEhlcmUgY2FsbGluZyB0aGUgYXN5bmMgUmVhZGFibGVTdHJlYW1EZWZhdWx0UmVhZGVyLnJlYWQoKSBpcyByZXNwb25zaWJsZSBmb3IgdHJpZ2dlcmluZyBDRFxuICAgICAgYXdhaXQgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoYXN5bmMgKCkgPT4ge1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgIGNvbnN0IHtkb25lLCB2YWx1ZX0gPSBhd2FpdCByZWFkZXIucmVhZCgpO1xuXG4gICAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNodW5rcy5wdXNoKHZhbHVlKTtcbiAgICAgICAgICByZWNlaXZlZExlbmd0aCArPSB2YWx1ZS5sZW5ndGg7XG5cbiAgICAgICAgICBpZiAocmVxdWVzdC5yZXBvcnRQcm9ncmVzcykge1xuICAgICAgICAgICAgcGFydGlhbFRleHQgPSByZXF1ZXN0LnJlc3BvbnNlVHlwZSA9PT0gJ3RleHQnID9cbiAgICAgICAgICAgICAgICAocGFydGlhbFRleHQgPz8gJycpICsgKGRlY29kZXIgPz89IG5ldyBUZXh0RGVjb2RlcikuZGVjb2RlKHZhbHVlLCB7c3RyZWFtOiB0cnVlfSkgOlxuICAgICAgICAgICAgICAgIHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgY29uc3QgcmVwb3J0UHJvZ3Jlc3MgPSAoKSA9PiBvYnNlcnZlci5uZXh0KHtcbiAgICAgICAgICAgICAgdHlwZTogSHR0cEV2ZW50VHlwZS5Eb3dubG9hZFByb2dyZXNzLFxuICAgICAgICAgICAgICB0b3RhbDogY29udGVudExlbmd0aCA/ICtjb250ZW50TGVuZ3RoIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICBsb2FkZWQ6IHJlY2VpdmVkTGVuZ3RoLFxuICAgICAgICAgICAgICBwYXJ0aWFsVGV4dCxcbiAgICAgICAgICAgIH0gYXMgSHR0cERvd25sb2FkUHJvZ3Jlc3NFdmVudCk7XG4gICAgICAgICAgICByZXFab25lID8gcmVxWm9uZS5ydW4ocmVwb3J0UHJvZ3Jlc3MpIDogcmVwb3J0UHJvZ3Jlc3MoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBDb21iaW5lIGFsbCBjaHVua3MuXG4gICAgICBjb25zdCBjaHVua3NBbGwgPSB0aGlzLmNvbmNhdENodW5rcyhjaHVua3MsIHJlY2VpdmVkTGVuZ3RoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGJvZHkgPSB0aGlzLnBhcnNlQm9keShyZXF1ZXN0LCBjaHVua3NBbGwpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgLy8gQm9keSBsb2FkaW5nIG9yIHBhcnNpbmcgZmFpbGVkXG4gICAgICAgIG9ic2VydmVyLmVycm9yKG5ldyBIdHRwRXJyb3JSZXNwb25zZSh7XG4gICAgICAgICAgZXJyb3IsXG4gICAgICAgICAgaGVhZGVyczogbmV3IEh0dHBIZWFkZXJzKHJlc3BvbnNlLmhlYWRlcnMpLFxuICAgICAgICAgIHN0YXR1czogcmVzcG9uc2Uuc3RhdHVzLFxuICAgICAgICAgIHN0YXR1c1RleHQ6IHJlc3BvbnNlLnN0YXR1c1RleHQsXG4gICAgICAgICAgdXJsOiBnZXRSZXNwb25zZVVybChyZXNwb25zZSkgPz8gcmVxdWVzdC51cmxXaXRoUGFyYW1zLFxuICAgICAgICB9KSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTYW1lIGJlaGF2aW9yIGFzIHRoZSBYaHJCYWNrZW5kXG4gICAgaWYgKHN0YXR1cyA9PT0gMCkge1xuICAgICAgc3RhdHVzID0gYm9keSA/IEh0dHBTdGF0dXNDb2RlLk9rIDogMDtcbiAgICB9XG5cbiAgICAvLyBvayBkZXRlcm1pbmVzIHdoZXRoZXIgdGhlIHJlc3BvbnNlIHdpbGwgYmUgdHJhbnNtaXR0ZWQgb24gdGhlIGV2ZW50IG9yXG4gICAgLy8gZXJyb3IgY2hhbm5lbC4gVW5zdWNjZXNzZnVsIHN0YXR1cyBjb2RlcyAobm90IDJ4eCkgd2lsbCBhbHdheXMgYmUgZXJyb3JzLFxuICAgIC8vIGJ1dCBhIHN1Y2Nlc3NmdWwgc3RhdHVzIGNvZGUgY2FuIHN0aWxsIHJlc3VsdCBpbiBhbiBlcnJvciBpZiB0aGUgdXNlclxuICAgIC8vIGFza2VkIGZvciBKU09OIGRhdGEgYW5kIHRoZSBib2R5IGNhbm5vdCBiZSBwYXJzZWQgYXMgc3VjaC5cbiAgICBjb25zdCBvayA9IHN0YXR1cyA+PSAyMDAgJiYgc3RhdHVzIDwgMzAwO1xuXG4gICAgaWYgKG9rKSB7XG4gICAgICBvYnNlcnZlci5uZXh0KG5ldyBIdHRwUmVzcG9uc2Uoe1xuICAgICAgICBib2R5LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBzdGF0dXMsXG4gICAgICAgIHN0YXR1c1RleHQsXG4gICAgICAgIHVybCxcbiAgICAgIH0pKTtcblxuICAgICAgLy8gVGhlIGZ1bGwgYm9keSBoYXMgYmVlbiByZWNlaXZlZCBhbmQgZGVsaXZlcmVkLCBubyBmdXJ0aGVyIGV2ZW50c1xuICAgICAgLy8gYXJlIHBvc3NpYmxlLiBUaGlzIHJlcXVlc3QgaXMgY29tcGxldGUuXG4gICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvYnNlcnZlci5lcnJvcihuZXcgSHR0cEVycm9yUmVzcG9uc2Uoe1xuICAgICAgICBlcnJvcjogYm9keSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgc3RhdHVzLFxuICAgICAgICBzdGF0dXNUZXh0LFxuICAgICAgICB1cmwsXG4gICAgICB9KSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZUJvZHkocmVxdWVzdDogSHR0cFJlcXVlc3Q8YW55PiwgYmluQ29udGVudDogVWludDhBcnJheSk6IHN0cmluZ3xBcnJheUJ1ZmZlcnxCbG9iXG4gICAgICB8b2JqZWN0fG51bGwge1xuICAgIHN3aXRjaCAocmVxdWVzdC5yZXNwb25zZVR5cGUpIHtcbiAgICAgIGNhc2UgJ2pzb24nOlxuICAgICAgICAvLyBzdHJpcHBpbmcgdGhlIFhTU0kgd2hlbiBwcmVzZW50XG4gICAgICAgIGNvbnN0IHRleHQgPSBuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUoYmluQ29udGVudCkucmVwbGFjZShYU1NJX1BSRUZJWCwgJycpO1xuICAgICAgICByZXR1cm4gdGV4dCA9PT0gJycgPyBudWxsIDogSlNPTi5wYXJzZSh0ZXh0KSBhcyBvYmplY3Q7XG4gICAgICBjYXNlICd0ZXh0JzpcbiAgICAgICAgcmV0dXJuIG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShiaW5Db250ZW50KTtcbiAgICAgIGNhc2UgJ2Jsb2InOlxuICAgICAgICByZXR1cm4gbmV3IEJsb2IoW2JpbkNvbnRlbnRdKTtcbiAgICAgIGNhc2UgJ2FycmF5YnVmZmVyJzpcbiAgICAgICAgcmV0dXJuIGJpbkNvbnRlbnQuYnVmZmVyO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlUmVxdWVzdEluaXQocmVxOiBIdHRwUmVxdWVzdDxhbnk+KTogUmVxdWVzdEluaXQge1xuICAgIC8vIFdlIGNvdWxkIHNoYXJlIHNvbWUgb2YgdGhpcyBsb2dpYyB3aXRoIHRoZSBYaHJCYWNrZW5kXG5cbiAgICBjb25zdCBoZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gICAgY29uc3QgY3JlZGVudGlhbHM6IFJlcXVlc3RDcmVkZW50aWFsc3x1bmRlZmluZWQgPSByZXEud2l0aENyZWRlbnRpYWxzID8gJ2luY2x1ZGUnIDogdW5kZWZpbmVkO1xuXG4gICAgLy8gU2V0dGluZyBhbGwgdGhlIHJlcXVlc3RlZCBoZWFkZXJzLlxuICAgIHJlcS5oZWFkZXJzLmZvckVhY2goKG5hbWUsIHZhbHVlcykgPT4gKGhlYWRlcnNbbmFtZV0gPSB2YWx1ZXMuam9pbignLCcpKSk7XG5cbiAgICAvLyBBZGQgYW4gQWNjZXB0IGhlYWRlciBpZiBvbmUgaXNuJ3QgcHJlc2VudCBhbHJlYWR5LlxuICAgIGhlYWRlcnNbJ0FjY2VwdCddID8/PSAnYXBwbGljYXRpb24vanNvbiwgdGV4dC9wbGFpbiwgKi8qJztcblxuICAgIC8vIEF1dG8tZGV0ZWN0IHRoZSBDb250ZW50LVR5cGUgaGVhZGVyIGlmIG9uZSBpc24ndCBwcmVzZW50IGFscmVhZHkuXG4gICAgaWYgKCFoZWFkZXJzWydDb250ZW50LVR5cGUnXSkge1xuICAgICAgY29uc3QgZGV0ZWN0ZWRUeXBlID0gcmVxLmRldGVjdENvbnRlbnRUeXBlSGVhZGVyKCk7XG4gICAgICAvLyBTb21ldGltZXMgQ29udGVudC1UeXBlIGRldGVjdGlvbiBmYWlscy5cbiAgICAgIGlmIChkZXRlY3RlZFR5cGUgIT09IG51bGwpIHtcbiAgICAgICAgaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSBkZXRlY3RlZFR5cGU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGJvZHk6IHJlcS5zZXJpYWxpemVCb2R5KCksXG4gICAgICBtZXRob2Q6IHJlcS5tZXRob2QsXG4gICAgICBoZWFkZXJzLFxuICAgICAgY3JlZGVudGlhbHMsXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgY29uY2F0Q2h1bmtzKGNodW5rczogVWludDhBcnJheVtdLCB0b3RhbExlbmd0aDogbnVtYmVyKTogVWludDhBcnJheSB7XG4gICAgY29uc3QgY2h1bmtzQWxsID0gbmV3IFVpbnQ4QXJyYXkodG90YWxMZW5ndGgpO1xuICAgIGxldCBwb3NpdGlvbiA9IDA7XG4gICAgZm9yIChjb25zdCBjaHVuayBvZiBjaHVua3MpIHtcbiAgICAgIGNodW5rc0FsbC5zZXQoY2h1bmssIHBvc2l0aW9uKTtcbiAgICAgIHBvc2l0aW9uICs9IGNodW5rLmxlbmd0aDtcbiAgICB9XG5cbiAgICByZXR1cm4gY2h1bmtzQWxsO1xuICB9XG59XG5cbi8qKlxuICogQWJzdHJhY3QgY2xhc3MgdG8gcHJvdmlkZSBhIG1vY2tlZCBpbXBsZW1lbnRhdGlvbiBvZiBgZmV0Y2goKWBcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEZldGNoRmFjdG9yeSB7XG4gIGFic3RyYWN0IGZldGNoOiB0eXBlb2YgZmV0Y2g7XG59XG5cbmZ1bmN0aW9uIG5vb3AoKTogdm9pZCB7fVxuXG4vKipcbiAqIFpvbmUuanMgdHJlYXRzIGEgcmVqZWN0ZWQgcHJvbWlzZSB0aGF0IGhhcyBub3QgeWV0IGJlZW4gYXdhaXRlZFxuICogYXMgYW4gdW5oYW5kbGVkIGVycm9yLiBUaGlzIGZ1bmN0aW9uIGFkZHMgYSBub29wIGAudGhlbmAgdG8gbWFrZVxuICogc3VyZSB0aGF0IFpvbmUuanMgZG9lc24ndCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgUHJvbWlzZSBpcyByZWplY3RlZFxuICogc3luY2hyb25vdXNseS5cbiAqL1xuZnVuY3Rpb24gc2lsZW5jZVN1cGVyZmx1b3VzVW5oYW5kbGVkUHJvbWlzZVJlamVjdGlvbihwcm9taXNlOiBQcm9taXNlPHVua25vd24+KSB7XG4gIHByb21pc2UudGhlbihub29wLCBub29wKTtcbn1cbiJdfQ==