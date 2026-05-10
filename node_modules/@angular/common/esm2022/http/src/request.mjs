/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { HttpContext } from './context';
import { HttpHeaders } from './headers';
import { HttpParams } from './params';
/**
 * Determine whether the given HTTP method may include a body.
 */
function mightHaveBody(method) {
    switch (method) {
        case 'DELETE':
        case 'GET':
        case 'HEAD':
        case 'OPTIONS':
        case 'JSONP':
            return false;
        default:
            return true;
    }
}
/**
 * Safely assert whether the given value is an ArrayBuffer.
 *
 * In some execution environments ArrayBuffer is not defined.
 */
function isArrayBuffer(value) {
    return typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer;
}
/**
 * Safely assert whether the given value is a Blob.
 *
 * In some execution environments Blob is not defined.
 */
function isBlob(value) {
    return typeof Blob !== 'undefined' && value instanceof Blob;
}
/**
 * Safely assert whether the given value is a FormData instance.
 *
 * In some execution environments FormData is not defined.
 */
function isFormData(value) {
    return typeof FormData !== 'undefined' && value instanceof FormData;
}
/**
 * Safely assert whether the given value is a URLSearchParams instance.
 *
 * In some execution environments URLSearchParams is not defined.
 */
function isUrlSearchParams(value) {
    return typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams;
}
/**
 * An outgoing HTTP request with an optional typed body.
 *
 * `HttpRequest` represents an outgoing request, including URL, method,
 * headers, body, and other request configuration options. Instances should be
 * assumed to be immutable. To modify a `HttpRequest`, the `clone`
 * method should be used.
 *
 * @publicApi
 */
export class HttpRequest {
    constructor(method, url, third, fourth) {
        this.url = url;
        /**
         * The request body, or `null` if one isn't set.
         *
         * Bodies are not enforced to be immutable, as they can include a reference to any
         * user-defined data type. However, interceptors should take care to preserve
         * idempotence by treating them as such.
         */
        this.body = null;
        /**
         * Whether this request should be made in a way that exposes progress events.
         *
         * Progress events are expensive (change detection runs on each event) and so
         * they should only be requested if the consumer intends to monitor them.
         *
         * Note: The `FetchBackend` doesn't support progress report on uploads.
         */
        this.reportProgress = false;
        /**
         * Whether this request should be sent with outgoing credentials (cookies).
         */
        this.withCredentials = false;
        /**
         * The expected response type of the server.
         *
         * This is used to parse the response appropriately before returning it to
         * the requestee.
         */
        this.responseType = 'json';
        this.method = method.toUpperCase();
        // Next, need to figure out which argument holds the HttpRequestInit
        // options, if any.
        let options;
        // Check whether a body argument is expected. The only valid way to omit
        // the body argument is to use a known no-body method like GET.
        if (mightHaveBody(this.method) || !!fourth) {
            // Body is the third argument, options are the fourth.
            this.body = (third !== undefined) ? third : null;
            options = fourth;
        }
        else {
            // No body required, options are the third argument. The body stays null.
            options = third;
        }
        // If options have been passed, interpret them.
        if (options) {
            // Normalize reportProgress and withCredentials.
            this.reportProgress = !!options.reportProgress;
            this.withCredentials = !!options.withCredentials;
            // Override default response type of 'json' if one is provided.
            if (!!options.responseType) {
                this.responseType = options.responseType;
            }
            // Override headers if they're provided.
            if (!!options.headers) {
                this.headers = options.headers;
            }
            if (!!options.context) {
                this.context = options.context;
            }
            if (!!options.params) {
                this.params = options.params;
            }
        }
        // If no headers have been passed in, construct a new HttpHeaders instance.
        if (!this.headers) {
            this.headers = new HttpHeaders();
        }
        // If no context have been passed in, construct a new HttpContext instance.
        if (!this.context) {
            this.context = new HttpContext();
        }
        // If no parameters have been passed in, construct a new HttpUrlEncodedParams instance.
        if (!this.params) {
            this.params = new HttpParams();
            this.urlWithParams = url;
        }
        else {
            // Encode the parameters to a string in preparation for inclusion in the URL.
            const params = this.params.toString();
            if (params.length === 0) {
                // No parameters, the visible URL is just the URL given at creation time.
                this.urlWithParams = url;
            }
            else {
                // Does the URL already have query parameters? Look for '?'.
                const qIdx = url.indexOf('?');
                // There are 3 cases to handle:
                // 1) No existing parameters -> append '?' followed by params.
                // 2) '?' exists and is followed by existing query string ->
                //    append '&' followed by params.
                // 3) '?' exists at the end of the url -> append params directly.
                // This basically amounts to determining the character, if any, with
                // which to join the URL and parameters.
                const sep = qIdx === -1 ? '?' : (qIdx < url.length - 1 ? '&' : '');
                this.urlWithParams = url + sep + params;
            }
        }
    }
    /**
     * Transform the free-form body into a serialized format suitable for
     * transmission to the server.
     */
    serializeBody() {
        // If no body is present, no need to serialize it.
        if (this.body === null) {
            return null;
        }
        // Check whether the body is already in a serialized form. If so,
        // it can just be returned directly.
        if (isArrayBuffer(this.body) || isBlob(this.body) || isFormData(this.body) ||
            isUrlSearchParams(this.body) || typeof this.body === 'string') {
            return this.body;
        }
        // Check whether the body is an instance of HttpUrlEncodedParams.
        if (this.body instanceof HttpParams) {
            return this.body.toString();
        }
        // Check whether the body is an object or array, and serialize with JSON if so.
        if (typeof this.body === 'object' || typeof this.body === 'boolean' ||
            Array.isArray(this.body)) {
            return JSON.stringify(this.body);
        }
        // Fall back on toString() for everything else.
        return this.body.toString();
    }
    /**
     * Examine the body and attempt to infer an appropriate MIME type
     * for it.
     *
     * If no such type can be inferred, this method will return `null`.
     */
    detectContentTypeHeader() {
        // An empty body has no content type.
        if (this.body === null) {
            return null;
        }
        // FormData bodies rely on the browser's content type assignment.
        if (isFormData(this.body)) {
            return null;
        }
        // Blobs usually have their own content type. If it doesn't, then
        // no type can be inferred.
        if (isBlob(this.body)) {
            return this.body.type || null;
        }
        // Array buffers have unknown contents and thus no type can be inferred.
        if (isArrayBuffer(this.body)) {
            return null;
        }
        // Technically, strings could be a form of JSON data, but it's safe enough
        // to assume they're plain strings.
        if (typeof this.body === 'string') {
            return 'text/plain';
        }
        // `HttpUrlEncodedParams` has its own content-type.
        if (this.body instanceof HttpParams) {
            return 'application/x-www-form-urlencoded;charset=UTF-8';
        }
        // Arrays, objects, boolean and numbers will be encoded as JSON.
        if (typeof this.body === 'object' || typeof this.body === 'number' ||
            typeof this.body === 'boolean') {
            return 'application/json';
        }
        // No type could be inferred.
        return null;
    }
    clone(update = {}) {
        // For method, url, and responseType, take the current value unless
        // it is overridden in the update hash.
        const method = update.method || this.method;
        const url = update.url || this.url;
        const responseType = update.responseType || this.responseType;
        // The body is somewhat special - a `null` value in update.body means
        // whatever current body is present is being overridden with an empty
        // body, whereas an `undefined` value in update.body implies no
        // override.
        const body = (update.body !== undefined) ? update.body : this.body;
        // Carefully handle the boolean options to differentiate between
        // `false` and `undefined` in the update args.
        const withCredentials = (update.withCredentials !== undefined) ? update.withCredentials : this.withCredentials;
        const reportProgress = (update.reportProgress !== undefined) ? update.reportProgress : this.reportProgress;
        // Headers and params may be appended to if `setHeaders` or
        // `setParams` are used.
        let headers = update.headers || this.headers;
        let params = update.params || this.params;
        // Pass on context if needed
        const context = update.context ?? this.context;
        // Check whether the caller has asked to add headers.
        if (update.setHeaders !== undefined) {
            // Set every requested header.
            headers =
                Object.keys(update.setHeaders)
                    .reduce((headers, name) => headers.set(name, update.setHeaders[name]), headers);
        }
        // Check whether the caller has asked to set params.
        if (update.setParams) {
            // Set every requested param.
            params = Object.keys(update.setParams)
                .reduce((params, param) => params.set(param, update.setParams[param]), params);
        }
        // Finally, construct the new HttpRequest using the pieces from above.
        return new HttpRequest(method, url, body, {
            params,
            headers,
            context,
            reportProgress,
            responseType,
            withCredentials,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbW1vbi9odHRwL3NyYy9yZXF1ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDdEMsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUN0QyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBaUJwQzs7R0FFRztBQUNILFNBQVMsYUFBYSxDQUFDLE1BQWM7SUFDbkMsUUFBUSxNQUFNLEVBQUU7UUFDZCxLQUFLLFFBQVEsQ0FBQztRQUNkLEtBQUssS0FBSyxDQUFDO1FBQ1gsS0FBSyxNQUFNLENBQUM7UUFDWixLQUFLLFNBQVMsQ0FBQztRQUNmLEtBQUssT0FBTztZQUNWLE9BQU8sS0FBSyxDQUFDO1FBQ2Y7WUFDRSxPQUFPLElBQUksQ0FBQztLQUNmO0FBQ0gsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLGFBQWEsQ0FBQyxLQUFVO0lBQy9CLE9BQU8sT0FBTyxXQUFXLEtBQUssV0FBVyxJQUFJLEtBQUssWUFBWSxXQUFXLENBQUM7QUFDNUUsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLE1BQU0sQ0FBQyxLQUFVO0lBQ3hCLE9BQU8sT0FBTyxJQUFJLEtBQUssV0FBVyxJQUFJLEtBQUssWUFBWSxJQUFJLENBQUM7QUFDOUQsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLFVBQVUsQ0FBQyxLQUFVO0lBQzVCLE9BQU8sT0FBTyxRQUFRLEtBQUssV0FBVyxJQUFJLEtBQUssWUFBWSxRQUFRLENBQUM7QUFDdEUsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLGlCQUFpQixDQUFDLEtBQVU7SUFDbkMsT0FBTyxPQUFPLGVBQWUsS0FBSyxXQUFXLElBQUksS0FBSyxZQUFZLGVBQWUs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LDRCQUE0QjtRQUM1QixNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUM7UUFFL0MscURBQXFEO1FBQ3JELElBQUksTUFBTSxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUU7WUFDbkMsOEJBQThCO1lBQzlCLE9BQU87Z0JBQ0gsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO3FCQUN6QixNQUFNLENBQUMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsVUFBVyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDMUY7UUFFRCxvREFBb0Q7UUFDcEQsSUFBSSxNQUFNLENBQUMsU0FBUyxFQUFFO1lBQ3BCLDZCQUE2QjtZQUM3QixNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDO2lCQUN4QixNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsU0FBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7U0FDOUY7UUFFRCxzRUFBc0U7UUFDdEUsT0FBTyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRTtZQUN4QyxNQUFNO1lBQ04sT0FBTztZQUNQLE9BQU87WUFDUCxjQUFjO1lBQ2QsWUFBWTtZQUNaLGVBQWU7U0FDaEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SHR0cENvbnRleHR9IGZyb20gJy4vY29udGV4dCc7XG5pbXBvcnQge0h0dHBIZWFkZXJzfSBmcm9tICcuL2hlYWRlcnMnO1xuaW1wb3J0IHtIdHRwUGFyYW1zfSBmcm9tICcuL3BhcmFtcyc7XG5cblxuLyoqXG4gKiBDb25zdHJ1Y3Rpb24gaW50ZXJmYWNlIGZvciBgSHR0cFJlcXVlc3Rgcy5cbiAqXG4gKiBBbGwgdmFsdWVzIGFyZSBvcHRpb25hbCBhbmQgd2lsbCBvdmVycmlkZSBkZWZhdWx0IHZhbHVlcyBpZiBwcm92aWRlZC5cbiAqL1xuaW50ZXJmYWNlIEh0dHBSZXF1ZXN0SW5pdCB7XG4gIGhlYWRlcnM/OiBIdHRwSGVhZGVycztcbiAgY29udGV4dD86IEh0dHBDb250ZXh0O1xuICByZXBvcnRQcm9ncmVzcz86IGJvb2xlYW47XG4gIHBhcmFtcz86IEh0dHBQYXJhbXM7XG4gIHJlc3BvbnNlVHlwZT86ICdhcnJheWJ1ZmZlcid8J2Jsb2InfCdqc29uJ3wndGV4dCc7XG4gIHdpdGhDcmVkZW50aWFscz86IGJvb2xlYW47XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIHdoZXRoZXIgdGhlIGdpdmVuIEhUVFAgbWV0aG9kIG1heSBpbmNsdWRlIGEgYm9keS5cbiAqL1xuZnVuY3Rpb24gbWlnaHRIYXZlQm9keShtZXRob2Q6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBzd2l0Y2ggKG1ldGhvZCkge1xuICAgIGNhc2UgJ0RFTEVURSc6XG4gICAgY2FzZSAnR0VUJzpcbiAgICBjYXNlICdIRUFEJzpcbiAgICBjYXNlICdPUFRJT05TJzpcbiAgICBjYXNlICdKU09OUCc6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogU2FmZWx5IGFzc2VydCB3aGV0aGVyIHRoZSBnaXZlbiB2YWx1ZSBpcyBhbiBBcnJheUJ1ZmZlci5cbiAqXG4gKiBJbiBzb21lIGV4ZWN1dGlvbiBlbnZpcm9ubWVudHMgQXJyYXlCdWZmZXIgaXMgbm90IGRlZmluZWQuXG4gKi9cbmZ1bmN0aW9uIGlzQXJyYXlCdWZmZXIodmFsdWU6IGFueSk6IHZhbHVlIGlzIEFycmF5QnVmZmVyIHtcbiAgcmV0dXJuIHR5cGVvZiBBcnJheUJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcgJiYgdmFsdWUgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcjtcbn1cblxuLyoqXG4gKiBTYWZlbHkgYXNzZXJ0IHdoZXRoZXIgdGhlIGdpdmVuIHZhbHVlIGlzIGEgQmxvYi5cbiAqXG4gKiBJbiBzb21lIGV4ZWN1dGlvbiBlbnZpcm9ubWVudHMgQmxvYiBpcyBub3QgZGVmaW5lZC5cbiAqL1xuZnVuY3Rpb24gaXNCbG9iKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBCbG9iIHtcbiAgcmV0dXJuIHR5cGVvZiBCbG9iICE9PSAndW5kZWZpbmVkJyAmJiB2YWx1ZSBpbnN0YW5jZW9mIEJsb2I7XG59XG5cbi8qKlxuICogU2FmZWx5IGFzc2VydCB3aGV0aGVyIHRoZSBnaXZlbiB2YWx1ZSBpcyBhIEZvcm1EYXRhIGluc3RhbmNlLlxuICpcbiAqIEluIHNvbWUgZXhlY3V0aW9uIGVudmlyb25tZW50cyBGb3JtRGF0YSBpcyBub3QgZGVmaW5lZC5cbiAqL1xuZnVuY3Rpb24gaXNGb3JtRGF0YSh2YWx1ZTogYW55KTogdmFsdWUgaXMgRm9ybURhdGEge1xuICByZXR1cm4gdHlwZW9mIEZvcm1EYXRhICE9PSAndW5kZWZpbmVkJyAmJiB2YWx1ZSBpbnN0YW5jZW9mIEZvcm1EYXRhO1xufVxuXG4vKipcbiAqIFNhZmVseSBhc3NlcnQgd2hldGhlciB0aGUgZ2l2ZW4gdmFsdWUgaXMgYSBVUkxTZWFyY2hQYXJhbXMgaW5zdGFuY2UuXG4gKlxuICogSW4gc29tZSBleGVjdXRpb24gZW52aXJvbm1lbnRzIFVSTFNlYXJjaFBhcmFtcyBpcyBub3QgZGVmaW5lZC5cbiAqL1xuZnVuY3Rpb24gaXNVcmxTZWFyY2hQYXJhbXModmFsdWU6IGFueSk6IHZhbHVlIGlzIFVSTFNlYXJjaFBhcmFtcyB7XG4gIHJldHVybiB0eXBlb2YgVVJMU2VhcmNoUGFyYW1zICE9PSAndW5kZWZpbmVkJyAmJiB2YWx1ZSBpbnN0YW5jZW9mIFVSTFNlYXJjaFBhcmFtcztcbn1cblxuLyoqXG4gKiBBbiBvdXRnb2luZyBIVFRQIHJlcXVlc3Qgd2l0aCBhbiBvcHRpb25hbCB0eXBlZCBib2R5LlxuICpcbiAqIGBIdHRwUmVxdWVzdGAgcmVwcmVzZW50cyBhbiBvdXRnb2luZyByZXF1ZXN0LCBpbmNsdWRpbmcgVVJMLCBtZXRob2QsXG4gKiBoZWFkZXJzLCBib2R5LCBhbmQgb3RoZXIgcmVxdWVzdCBjb25maWd1cmF0aW9uIG9wdGlvbnMuIEluc3RhbmNlcyBzaG91bGQgYmVcbiAqIGFzc3VtZWQgdG8gYmUgaW1tdXRhYmxlLiBUbyBtb2RpZnkgYSBgSHR0cFJlcXVlc3RgLCB0aGUgYGNsb25lYFxuICogbWV0aG9kIHNob3VsZCBiZSB1c2VkLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIEh0dHBSZXF1ZXN0PFQ+IHtcbiAgLyoqXG4gICAqIFRoZSByZXF1ZXN0IGJvZHksIG9yIGBudWxsYCBpZiBvbmUgaXNuJ3Qgc2V0LlxuICAgKlxuICAgKiBCb2RpZXMgYXJlIG5vdCBlbmZvcmNlZCB0byBiZSBpbW11dGFibGUsIGFzIHRoZXkgY2FuIGluY2x1ZGUgYSByZWZlcmVuY2UgdG8gYW55XG4gICAqIHVzZXItZGVmaW5lZCBkYXRhIHR5cGUuIEhvd2V2ZXIsIGludGVyY2VwdG9ycyBzaG91bGQgdGFrZSBjYXJlIHRvIHByZXNlcnZlXG4gICAqIGlkZW1wb3RlbmNlIGJ5IHRyZWF0aW5nIHRoZW0gYXMgc3VjaC5cbiAgICovXG4gIHJlYWRvbmx5IGJvZHk6IFR8bnVsbCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIE91dGdvaW5nIGhlYWRlcnMgZm9yIHRoaXMgcmVxdWVzdC5cbiAgICovXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICByZWFkb25seSBoZWFkZXJzITogSHR0cEhlYWRlcnM7XG5cbiAgLyoqXG4gICAqIFNoYXJlZCBhbmQgbXV0YWJsZSBjb250ZXh0IHRoYXQgY2FuIGJlIHVzZWQgYnkgaW50ZXJjZXB0b3JzXG4gICAqL1xuICByZWFkb25seSBjb250ZXh0ITogSHR0cENvbnRleHQ7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhpcyByZXF1ZXN0IHNob3VsZCBiZSBtYWRlIGluIGEgd2F5IHRoYXQgZXhwb3NlcyBwcm9ncmVzcyBldmVudHMuXG4gICAqXG4gICAqIFByb2dyZXNzIGV2ZW50cyBhcmUgZXhwZW5zaXZlIChjaGFuZ2UgZGV0ZWN0aW9uIHJ1bnMgb24gZWFjaCBldmVudCkgYW5kIHNvXG4gICAqIHRoZXkgc2hvdWxkIG9ubHkgYmUgcmVxdWVzdGVkIGlmIHRoZSBjb25zdW1lciBpbnRlbmRzIHRvIG1vbml0b3IgdGhlbS5cbiAgICpcbiAgICogTm90ZTogVGhlIGBGZXRjaEJhY2tlbmRgIGRvZXNuJ3Qgc3VwcG9ydCBwcm9ncmVzcyByZXBvcnQgb24gdXBsb2Fkcy5cbiAgICovXG4gIHJlYWRvbmx5IHJlcG9ydFByb2dyZXNzOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhpcyByZXF1ZXN0IHNob3VsZCBiZSBzZW50IHdpdGggb3V0Z29pbmcgY3JlZGVudGlhbHMgKGNvb2tpZXMpLlxuICAgKi9cbiAgcmVhZG9ubHkgd2l0aENyZWRlbnRpYWxzOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFRoZSBleHBlY3RlZCByZXNwb25zZSB0eXBlIG9mIHRoZSBzZXJ2ZXIuXG4gICAqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBwYXJzZSB0aGUgcmVzcG9uc2UgYXBwcm9wcmlhdGVseSBiZWZvcmUgcmV0dXJuaW5nIGl0IHRvXG4gICAqIHRoZSByZXF1ZXN0ZWUuXG4gICAqL1xuICByZWFkb25seSByZXNwb25zZVR5cGU6ICdhcnJheWJ1ZmZlcid8J2Jsb2InfCdqc29uJ3wndGV4dCcgPSAnanNvbic7XG5cbiAgLyoqXG4gICAqIFRoZSBvdXRnb2luZyBIVFRQIHJlcXVlc3QgbWV0aG9kLlxuICAgKi9cbiAgcmVhZG9ubHkgbWV0aG9kOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIE91dGdvaW5nIFVSTCBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKiBUbyBwYXNzIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIEhUVFAgcGFyYW1ldGVycyBpbiB0aGUgVVJMLXF1ZXJ5LXN0cmluZyBmb3JtYXQsXG4gICAqIHRoZSBgSHR0cFBhcmFtc09wdGlvbnNgJyBgZnJvbVN0cmluZ2AgbWF5IGJlIHVzZWQuIEZvciBleGFtcGxlOlxuICAgKlxuICAgKiBgYGBcbiAgICogbmV3IEh0dHBQYXJhbXMoe2Zyb21TdHJpbmc6ICdhbmd1bGFyPWF3ZXNvbWUnfSlcbiAgICogYGBgXG4gICAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcmVhZG9ubHkgcGFyYW1zITogSHR0cFBhcmFtcztcblxuICAvKipcbiAgICogVGhlIG91dGdvaW5nIFVSTCB3aXRoIGFsbCBVUkwgcGFyYW1ldGVycyBzZXQuXG4gICAqL1xuICByZWFkb25seSB1cmxXaXRoUGFyYW1zOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IobWV0aG9kOiAnREVMRVRFJ3wnR0VUJ3wnSEVBRCd8J0pTT05QJ3wnT1BUSU9OUycsIHVybDogc3RyaW5nLCBpbml0Pzoge1xuICAgIGhlYWRlcnM/OiBIdHRwSGVhZGVycyxcbiAgICBjb250ZXh0PzogSHR0cENvbnRleHQsXG4gICAgcmVwb3J0UHJvZ3Jlc3M/OiBib29sZWFuLFxuICAgIHBhcmFtcz86IEh0dHBQYXJhbXMsXG4gICAgcmVzcG9uc2VUeXBlPzogJ2FycmF5YnVmZmVyJ3wnYmxvYid8J2pzb24nfCd0ZXh0JyxcbiAgICB3aXRoQ3JlZGVudGlhbHM/OiBib29sZWFuLFxuICB9KTtcbiAgY29uc3RydWN0b3IobWV0aG9kOiAnUE9TVCd8J1BVVCd8J1BBVENIJywgdXJsOiBzdHJpbmcsIGJvZHk6IFR8bnVsbCwgaW5pdD86IHtcbiAgICBoZWFkZXJzPzogSHR0cEhlYWRlcnMsXG4gICAgY29udGV4dD86IEh0dHBDb250ZXh0LFxuICAgIHJlcG9ydFByb2dyZXNzPzogYm9vbGVhbixcbiAgICBwYXJhbXM/OiBIdHRwUGFyYW1zLFxuICAgIHJlc3BvbnNlVHlwZT86ICdhcnJheWJ1ZmZlcid8J2Jsb2InfCdqc29uJ3wndGV4dCcsXG4gICAgd2l0aENyZWRlbnRpYWxzPzogYm9vbGVhbixcbiAgfSk7XG4gIGNvbnN0cnVjdG9yKG1ldGhvZDogc3RyaW5nLCB1cmw6IHN0cmluZywgYm9keTogVHxudWxsLCBpbml0Pzoge1xuICAgIGhlYWRlcnM/OiBIdHRwSGVhZGVycyxcbiAgICBjb250ZXh0PzogSHR0cENvbnRleHQsXG4gICAgcmVwb3J0UHJvZ3Jlc3M/OiBib29sZWFuLFxuICAgIHBhcmFtcz86IEh0dHBQYXJhbXMsXG4gICAgcmVzcG9uc2VUeXBlPzogJ2FycmF5YnVmZmVyJ3wnYmxvYid8J2pzb24nfCd0ZXh0JyxcbiAgICB3aXRoQ3JlZGVudGlhbHM/OiBib29sZWFuLFxuICB9KTtcbiAgY29uc3RydWN0b3IoXG4gICAgICBtZXRob2Q6IHN0cmluZywgcmVhZG9ubHkgdXJsOiBzdHJpbmcsIHRoaXJkPzogVHx7XG4gICAgICAgIGhlYWRlcnM/OiBIdHRwSGVhZGVycyxcbiAgICAgICAgY29udGV4dD86IEh0dHBDb250ZXh0LFxuICAgICAgICByZXBvcnRQcm9ncmVzcz86IGJvb2xlYW4sXG4gICAgICAgIHBhcmFtcz86IEh0dHBQYXJhbXMsXG4gICAgICAgIHJlc3BvbnNlVHlwZT86ICdhcnJheWJ1ZmZlcid8J2Jsb2InfCdqc29uJ3wndGV4dCcsXG4gICAgICAgIHdpdGhDcmVkZW50aWFscz86IGJvb2xlYW4sXG4gICAgICB9fG51bGwsXG4gICAgICBmb3VydGg/OiB7XG4gICAgICAgIGhlYWRlcnM/OiBIdHRwSGVhZGVycyxcbiAgICAgICAgY29udGV4dD86IEh0dHBDb250ZXh0LFxuICAgICAgICByZXBvcnRQcm9ncmVzcz86IGJvb2xlYW4sXG4gICAgICAgIHBhcmFtcz86IEh0dHBQYXJhbXMsXG4gICAgICAgIHJlc3BvbnNlVHlwZT86ICdhcnJheWJ1ZmZlcid8J2Jsb2InfCdqc29uJ3wndGV4dCcsXG4gICAgICAgIHdpdGhDcmVkZW50aWFscz86IGJvb2xlYW4sXG4gICAgICB9KSB7XG4gICAgdGhpcy5tZXRob2QgPSBtZXRob2QudG9VcHBlckNhc2UoKTtcbiAgICAvLyBOZXh0LCBuZWVkIHRvIGZpZ3VyZSBvdXQgd2hpY2ggYXJndW1lbnQgaG9sZHMgdGhlIEh0dHBSZXF1ZXN0SW5pdFxuICAgIC8vIG9wdGlvbnMsIGlmIGFueS5cbiAgICBsZXQgb3B0aW9uczogSHR0cFJlcXVlc3RJbml0fHVuZGVmaW5lZDtcblxuICAgIC8vIENoZWNrIHdoZXRoZXIgYSBib2R5IGFyZ3VtZW50IGlzIGV4cGVjdGVkLiBUaGUgb25seSB2YWxpZCB3YXkgdG8gb21pdFxuICAgIC8vIHRoZSBib2R5IGFyZ3VtZW50IGlzIHRvIHVzZSBhIGtub3duIG5vLWJvZHkgbWV0aG9kIGxpa2UgR0VULlxuICAgIGlmIChtaWdodEhhdmVCb2R5KHRoaXMubWV0aG9kKSB8fCAhIWZvdXJ0aCkge1xuICAgICAgLy8gQm9keSBpcyB0aGUgdGhpcmQgYXJndW1lbnQsIG9wdGlvbnMgYXJlIHRoZSBmb3VydGguXG4gICAgICB0aGlzLmJvZHkgPSAodGhpcmQgIT09IHVuZGVmaW5lZCkgPyB0aGlyZCBhcyBUIDogbnVsbDtcbiAgICAgIG9wdGlvbnMgPSBmb3VydGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE5vIGJvZHkgcmVxdWlyZWQsIG9wdGlvbnMgYXJlIHRoZSB0aGlyZCBhcmd1bWVudC4gVGhlIGJvZHkgc3RheXMgbnVsbC5cbiAgICAgIG9wdGlvbnMgPSB0aGlyZCBhcyBIdHRwUmVxdWVzdEluaXQ7XG4gICAgfVxuXG4gICAgLy8gSWYgb3B0aW9ucyBoYXZlIGJlZW4gcGFzc2VkLCBpbnRlcnByZXQgdGhlbS5cbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgLy8gTm9ybWFsaXplIHJlcG9ydFByb2dyZXNzIGFuZCB3aXRoQ3JlZGVudGlhbHMuXG4gICAgICB0aGlzLnJlcG9ydFByb2dyZXNzID0gISFvcHRpb25zLnJlcG9ydFByb2dyZXNzO1xuICAgICAgdGhpcy53aXRoQ3JlZGVudGlhbHMgPSAhIW9wdGlvbnMud2l0aENyZWRlbnRpYWxzO1xuXG4gICAgICAvLyBPdmVycmlkZSBkZWZhdWx0IHJlc3BvbnNlIHR5cGUgb2YgJ2pzb24nIGlmIG9uZSBpcyBwcm92aWRlZC5cbiAgICAgIGlmICghIW9wdGlvbnMucmVzcG9uc2VUeXBlKSB7XG4gICAgICAgIHRoaXMucmVzcG9uc2VUeXBlID0gb3B0aW9ucy5yZXNwb25zZVR5cGU7XG4gICAgICB9XG5cbiAgICAgIC8vIE92ZXJyaWRlIGhlYWRlcnMgaWYgdGhleSdyZSBwcm92aWRlZC5cbiAgICAgIGlmICghIW9wdGlvbnMuaGVhZGVycykge1xuICAgICAgICB0aGlzLmhlYWRlcnMgPSBvcHRpb25zLmhlYWRlcnM7XG4gICAgICB9XG5cbiAgICAgIGlmICghIW9wdGlvbnMuY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBvcHRpb25zLmNvbnRleHQ7XG4gICAgICB9XG5cbiAgICAgIGlmICghIW9wdGlvbnMucGFyYW1zKSB7XG4gICAgICAgIHRoaXMucGFyYW1zID0gb3B0aW9ucy5wYXJhbXM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgbm8gaGVhZGVycyBoYXZlIGJlZW4gcGFzc2VkIGluLCBjb25zdHJ1Y3QgYSBuZXcgSHR0cEhlYWRlcnMgaW5zdGFuY2UuXG4gICAgaWYgKCF0aGlzLmhlYWRlcnMpIHtcbiAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIdHRwSGVhZGVycygpO1xuICAgIH1cblxuICAgIC8vIElmIG5vIGNvbnRleHQgaGF2ZSBiZWVuIHBhc3NlZCBpbiwgY29uc3RydWN0IGEgbmV3IEh0dHBDb250ZXh0IGluc3RhbmNlLlxuICAgIGlmICghdGhpcy5jb250ZXh0KSB7XG4gICAgICB0aGlzLmNvbnRleHQgPSBuZXcgSHR0cENvbnRleHQoKTtcbiAgICB9XG5cbiAgICAvLyBJZiBubyBwYXJhbWV0ZXJzIGhhdmUgYmVlbiBwYXNzZWQgaW4sIGNvbnN0cnVjdCBhIG5ldyBIdHRwVXJsRW5jb2RlZFBhcmFtcyBpbnN0YW5jZS5cbiAgICBpZiAoIXRoaXMucGFyYW1zKSB7XG4gICAgICB0aGlzLnBhcmFtcyA9IG5ldyBIdHRwUGFyYW1zKCk7XG4gICAgICB0aGlzLnVybFdpdGhQYXJhbXMgPSB1cmw7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEVuY29kZSB0aGUgcGFyYW1ldGVycyB0byBhIHN0cmluZyBpbiBwcmVwYXJhdGlvbiBmb3IgaW5jbHVzaW9uIGluIHRoZSBVUkwuXG4gICAgICBjb25zdCBwYXJhbXMgPSB0aGlzLnBhcmFtcy50b1N0cmluZygpO1xuICAgICAgaWYgKHBhcmFtcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgLy8gTm8gcGFyYW1ldGVycywgdGhlIHZpc2libGUgVVJMIGlzIGp1c3QgdGhlIFVSTCBnaXZlbiBhdCBjcmVhdGlvbiB0aW1lLlxuICAgICAgICB0aGlzLnVybFdpdGhQYXJhbXMgPSB1cmw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBEb2VzIHRoZSBVUkwgYWxyZWFkeSBoYXZlIHF1ZXJ5IHBhcmFtZXRlcnM/IExvb2sgZm9yICc/Jy5cbiAgICAgICAgY29uc3QgcUlkeCA9IHVybC5pbmRleE9mKCc/Jyk7XG4gICAgICAgIC8vIFRoZXJlIGFyZSAzIGNhc2VzIHRvIGhhbmRsZTpcbiAgICAgICAgLy8gMSkgTm8gZXhpc3RpbmcgcGFyYW1ldGVycyAtPiBhcHBlbmQgJz8nIGZvbGxvd2VkIGJ5IHBhcmFtcy5cbiAgICAgICAgLy8gMikgJz8nIGV4aXN0cyBhbmQgaXMgZm9sbG93ZWQgYnkgZXhpc3RpbmcgcXVlcnkgc3RyaW5nIC0+XG4gICAgICAgIC8vICAgIGFwcGVuZCAnJicgZm9sbG93ZWQgYnkgcGFyYW1zLlxuICAgICAgICAvLyAzKSAnPycgZXhpc3RzIGF0IHRoZSBlbmQgb2YgdGhlIHVybCAtPiBhcHBlbmQgcGFyYW1zIGRpcmVjdGx5LlxuICAgICAgICAvLyBUaGlzIGJhc2ljYWxseSBhbW91bnRzIHRvIGRldGVybWluaW5nIHRoZSBjaGFyYWN0ZXIsIGlmIGFueSwgd2l0aFxuICAgICAgICAvLyB3aGljaCB0byBqb2luIHRoZSBVUkwgYW5kIHBhcmFtZXRlcnMuXG4gICAgICAgIGNvbnN0IHNlcDogc3RyaW5nID0gcUlkeCA9PT0gLTEgPyAnPycgOiAocUlkeCA8IHVybC5sZW5ndGggLSAxID8gJyYnIDogJycpO1xuICAgICAgICB0aGlzLnVybFdpdGhQYXJhbXMgPSB1cmwgKyBzZXAgKyBwYXJhbXM7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybSB0aGUgZnJlZS1mb3JtIGJvZHkgaW50byBhIHNlcmlhbGl6ZWQgZm9ybWF0IHN1aXRhYmxlIGZvclxuICAgKiB0cmFuc21pc3Npb24gdG8gdGhlIHNlcnZlci5cbiAgICovXG4gIHNlcmlhbGl6ZUJvZHkoKTogQXJyYXlCdWZmZXJ8QmxvYnxGb3JtRGF0YXxVUkxTZWFyY2hQYXJhbXN8c3RyaW5nfG51bGwge1xuICAgIC8vIElmIG5vIGJvZHkgaXMgcHJlc2VudCwgbm8gbmVlZCB0byBzZXJpYWxpemUgaXQuXG4gICAgaWYgKHRoaXMuYm9keSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIGJvZHkgaXMgYWxyZWFkeSBpbiBhIHNlcmlhbGl6ZWQgZm9ybS4gSWYgc28sXG4gICAgLy8gaXQgY2FuIGp1c3QgYmUgcmV0dXJuZWQgZGlyZWN0bHkuXG4gICAgaWYgKGlzQXJyYXlCdWZmZXIodGhpcy5ib2R5KSB8fCBpc0Jsb2IodGhpcy5ib2R5KSB8fCBpc0Zvcm1EYXRhKHRoaXMuYm9keSkgfHxcbiAgICAgICAgaXNVcmxTZWFyY2hQYXJhbXModGhpcy5ib2R5KSB8fCB0eXBlb2YgdGhpcy5ib2R5ID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHRoaXMuYm9keTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgd2hldGhlciB0aGUgYm9keSBpcyBhbiBpbnN0YW5jZSBvZiBIdHRwVXJsRW5jb2RlZFBhcmFtcy5cbiAgICBpZiAodGhpcy5ib2R5IGluc3RhbmNlb2YgSHR0cFBhcmFtcykge1xuICAgICAgcmV0dXJuIHRoaXMuYm9keS50b1N0cmluZygpO1xuICAgIH1cbiAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBib2R5IGlzIGFuIG9iamVjdCBvciBhcnJheSwgYW5kIHNlcmlhbGl6ZSB3aXRoIEpTT04gaWYgc28uXG4gICAgaWYgKHR5cGVvZiB0aGlzLmJvZHkgPT09ICdvYmplY3QnIHx8IHR5cGVvZiB0aGlzLmJvZHkgPT09ICdib29sZWFuJyB8fFxuICAgICAgICBBcnJheS5pc0FycmF5KHRoaXMuYm9keSkpIHtcbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh0aGlzLmJvZHkpO1xuICAgIH1cbiAgICAvLyBGYWxsIGJhY2sgb24gdG9TdHJpbmcoKSBmb3IgZXZlcnl0aGluZyBlbHNlLlxuICAgIHJldHVybiAodGhpcy5ib2R5IGFzIGFueSkudG9TdHJpbmcoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGFtaW5lIHRoZSBib2R5IGFuZCBhdHRlbXB0IHRvIGluZmVyIGFuIGFwcHJvcHJpYXRlIE1JTUUgdHlwZVxuICAgKiBmb3IgaXQuXG4gICAqXG4gICAqIElmIG5vIHN1Y2ggdHlwZSBjYW4gYmUgaW5mZXJyZWQsIHRoaXMgbWV0aG9kIHdpbGwgcmV0dXJuIGBudWxsYC5cbiAgICovXG4gIGRldGVjdENvbnRlbnRUeXBlSGVhZGVyKCk6IHN0cmluZ3xudWxsIHtcbiAgICAvLyBBbiBlbXB0eSBib2R5IGhhcyBubyBjb250ZW50IHR5cGUuXG4gICAgaWYgKHRoaXMuYm9keSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIC8vIEZvcm1EYXRhIGJvZGllcyByZWx5IG9uIHRoZSBicm93c2VyJ3MgY29udGVudCB0eXBlIGFzc2lnbm1lbnQuXG4gICAgaWYgKGlzRm9ybURhdGEodGhpcy5ib2R5KSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIC8vIEJsb2JzIHVzdWFsbHkgaGF2ZSB0aGVpciBvd24gY29udGVudCB0eXBlLiBJZiBpdCBkb2Vzbid0LCB0aGVuXG4gICAgLy8gbm8gdHlwZSBjYW4gYmUgaW5mZXJyZWQuXG4gICAgaWYgKGlzQmxvYih0aGlzLmJvZHkpKSB7XG4gICAgICByZXR1cm4gdGhpcy5ib2R5LnR5cGUgfHwgbnVsbDtcbiAgICB9XG4gICAgLy8gQXJyYXkgYnVmZmVycyBoYXZlIHVua25vd24gY29udGVudHMgYW5kIHRodXMgbm8gdHlwZSBjYW4gYmUgaW5mZXJyZWQuXG4gICAgaWYgKGlzQXJyYXlCdWZmZXIodGhpcy5ib2R5KSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIC8vIFRlY2huaWNhbGx5LCBzdHJpbmdzIGNvdWxkIGJlIGEgZm9ybSBvZiBKU09OIGRhdGEsIGJ1dCBpdCdzIHNhZmUgZW5vdWdoXG4gICAgLy8gdG8gYXNzdW1lIHRoZXkncmUgcGxhaW4gc3RyaW5ncy5cbiAgICBpZiAodHlwZW9mIHRoaXMuYm9keSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiAndGV4dC9wbGFpbic7XG4gICAgfVxuICAgIC8vIGBIdHRwVXJsRW5jb2RlZFBhcmFtc2AgaGFzIGl0cyBvd24gY29udGVudC10eXBlLlxuICAgIGlmICh0aGlzLmJvZHkgaW5zdGFuY2VvZiBIdHRwUGFyYW1zKSB7XG4gICAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDtjaGFyc2V0PVVURi04JztcbiAgICB9XG4gICAgLy8gQXJyYXlzLCBvYmplY3RzLCBib29sZWFuIGFuZCBudW1iZXJzIHdpbGwgYmUgZW5jb2RlZCBhcyBKU09OLlxuICAgIGlmICh0eXBlb2YgdGhpcy5ib2R5ID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdGhpcy5ib2R5ID09PSAnbnVtYmVyJyB8fFxuICAgICAgICB0eXBlb2YgdGhpcy5ib2R5ID09PSAnYm9vbGVhbicpIHtcbiAgICAgIHJldHVybiAnYXBwbGljYXRpb24vanNvbic7XG4gICAgfVxuICAgIC8vIE5vIHR5cGUgY291bGQgYmUgaW5mZXJyZWQuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjbG9uZSgpOiBIdHRwUmVxdWVzdDxUPjtcbiAgY2xvbmUodXBkYXRlOiB7XG4gICAgaGVhZGVycz86IEh0dHBIZWFkZXJzLFxuICAgIGNvbnRleHQ/OiBIdHRwQ29udGV4dCxcbiAgICByZXBvcnRQcm9ncmVzcz86IGJvb2xlYW4sXG4gICAgcGFyYW1zPzogSHR0cFBhcmFtcyxcbiAgICByZXNwb25zZVR5cGU/OiAnYXJyYXlidWZmZXInfCdibG9iJ3wnanNvbid8J3RleHQnLFxuICAgIHdpdGhDcmVkZW50aWFscz86IGJvb2xlYW4sXG4gICAgYm9keT86IFR8bnVsbCxcbiAgICBtZXRob2Q/OiBzdHJpbmcsXG4gICAgdXJsPzogc3RyaW5nLFxuICAgIHNldEhlYWRlcnM/OiB7W25hbWU6IHN0cmluZ106IHN0cmluZ3xzdHJpbmdbXX0sXG4gICAgc2V0UGFyYW1zPzoge1twYXJhbTogc3RyaW5nXTogc3RyaW5nfSxcbiAgfSk6IEh0dHBSZXF1ZXN0PFQ+O1xuICBjbG9uZTxWPih1cGRhdGU6IHtcbiAgICBoZWFkZXJzPzogSHR0cEhlYWRlcnMsXG4gICAgY29udGV4dD86IEh0dHBDb250ZXh0LFxuICAgIHJlcG9ydFByb2dyZXNzPzogYm9vbGVhbixcbiAgICBwYXJhbXM/OiBIdHRwUGFyYW1zLFxuICAgIHJlc3BvbnNlVHlwZT86ICdhcnJheWJ1ZmZlcid8J2Jsb2InfCdqc29uJ3wndGV4dCcsXG4gICAgd2l0aENyZWRlbnRpYWxzPzogYm9vbGVhbixcbiAgICBib2R5PzogVnxudWxsLFxuICAgIG1ldGhvZD86IHN0cmluZyxcbiAgICB1cmw/OiBzdHJpbmcsXG4gICAgc2V0SGVhZGVycz86IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfHN0cmluZ1tdfSxcbiAgICBzZXRQYXJhbXM/OiB7W3BhcmFtOiBzdHJpbmddOiBzdHJpbmd9LFxuICB9KTogSHR0cFJlcXVlc3Q8Vj47XG4gIGNsb25lKHVwZGF0ZToge1xuICAgIGhlYWRlcnM/OiBIdHRwSGVhZGVycyxcbiAgICBjb250ZXh0PzogSHR0cENvbnRleHQsXG4gICAgcmVwb3J0UHJvZ3Jlc3M/OiBib29sZWFuLFxuICAgIHBhcmFtcz86IEh0dHBQYXJhbXMsXG4gICAgcmVzcG9uc2VUeXBlPzogJ2FycmF5YnVmZmVyJ3wnYmxvYid8J2pzb24nfCd0ZXh0JyxcbiAgICB3aXRoQ3JlZGVudGlhbHM/OiBib29sZWFuLFxuICAgIGJvZHk/OiBhbnl8bnVsbCxcbiAgICBtZXRob2Q/OiBzdHJpbmcsXG4gICAgdXJsPzogc3RyaW5nLFxuICAgIHNldEhlYWRlcnM/OiB7W25hbWU6IHN0cmluZ106IHN0cmluZ3xzdHJpbmdbXX0sXG4gICAgc2V0UGFyYW1zPzoge1twYXJhbTogc3RyaW5nXTogc3RyaW5nfTtcbiAgfSA9IHt9KTogSHR0cFJlcXVlc3Q8YW55PiB7XG4gICAgLy8gRm9yIG1ldGhvZCwgdXJsLCBhbmQgcmVzcG9uc2VUeXBlLCB0YWtlIHRoZSBjdXJyZW50IHZhbHVlIHVubGVzc1xuICAgIC8vIGl0IGlzIG92ZXJyaWRkZW4gaW4gdGhlIHVwZGF0ZSBoYXNoLlxuICAgIGNvbnN0IG1ldGhvZCA9IHVwZGF0ZS5tZXRob2QgfHwgdGhpcy5tZXRob2Q7XG4gICAgY29uc3QgdXJsID0gdXBkYXRlLnVybCB8fCB0aGlzLnVybDtcbiAgICBjb25zdCByZXNwb25zZVR5cGUgPSB1cGRhdGUucmVzcG9uc2VUeXBlIHx8IHRoaXMucmVzcG9uc2VUeXBlO1xuXG4gICAgLy8gVGhlIGJvZHkgaXMgc29tZXdoYXQgc3BlY2lhbCAtIGEgYG51bGxgIHZhbHVlIGluIHVwZGF0ZS5ib2R5IG1lYW5zXG4gICAgLy8gd2hhdGV2ZXIgY3VycmVudCBib2R5IGlzIHByZXNlbnQgaXMgYmVpbmcgb3ZlcnJpZGRlbiB3aXRoIGFuIGVtcHR5XG4gICAgLy8gYm9keSwgd2hlcmVhcyBhbiBgdW5kZWZpbmVkYCB2YWx1ZSBpbiB1cGRhdGUuYm9keSBpbXBsaWVzIG5vXG4gICAgLy8gb3ZlcnJpZGUuXG4gICAgY29uc3QgYm9keSA9ICh1cGRhdGUuYm9keSAhPT0gdW5kZWZpbmVkKSA/IHVwZGF0ZS5ib2R5IDogdGhpcy5ib2R5O1xuXG4gICAgLy8gQ2FyZWZ1bGx5IGhhbmRsZSB0aGUgYm9vbGVhbiBvcHRpb25zIHRvIGRpZmZlcmVudGlhdGUgYmV0d2VlblxuICAgIC8vIGBmYWxzZWAgYW5kIGB1bmRlZmluZWRgIGluIHRoZSB1cGRhdGUgYXJncy5cbiAgICBjb25zdCB3aXRoQ3JlZGVudGlhbHMgPVxuICAgICAgICAodXBkYXRlLndpdGhDcmVkZW50aWFscyAhPT0gdW5kZWZpbmVkKSA/IHVwZGF0ZS53aXRoQ3JlZGVudGlhbHMgOiB0aGlzLndpdGhDcmVkZW50aWFscztcbiAgICBjb25zdCByZXBvcnRQcm9ncmVzcyA9XG4gICAgICAgICh1cGRhdGUucmVwb3J0UHJvZ3Jlc3MgIT09IHVuZGVmaW5lZCkgPyB1cGRhdGUucmVwb3J0UHJvZ3Jlc3MgOiB0aGlzLnJlcG9ydFByb2dyZXNzO1xuXG4gICAgLy8gSGVhZGVycyBhbmQgcGFyYW1zIG1heSBiZSBhcHBlbmRlZCB0byBpZiBgc2V0SGVhZGVyc2Agb3JcbiAgICAvLyBgc2V0UGFyYW1zYCBhcmUgdXNlZC5cbiAgICBsZXQgaGVhZGVycyA9IHVwZGF0ZS5oZWFkZXJzIHx8IHRoaXMuaGVhZGVycztcbiAgICBsZXQgcGFyYW1zID0gdXBkYXRlLnBhcmFtcyB8fCB0aGlzLnBhcmFtcztcblxuICAgIC8vIFBhc3Mgb24gY29udGV4dCBpZiBuZWVkZWRcbiAgICBjb25zdCBjb250ZXh0ID0gdXBkYXRlLmNvbnRleHQgPz8gdGhpcy5jb250ZXh0O1xuXG4gICAgLy8gQ2hlY2sgd2hldGhlciB0aGUgY2FsbGVyIGhhcyBhc2tlZCB0byBhZGQgaGVhZGVycy5cbiAgICBpZiAodXBkYXRlLnNldEhlYWRlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gU2V0IGV2ZXJ5IHJlcXVlc3RlZCBoZWFkZXIuXG4gICAgICBoZWFkZXJzID1cbiAgICAgICAgICBPYmplY3Qua2V5cyh1cGRhdGUuc2V0SGVhZGVycylcbiAgICAgICAgICAgICAgLnJlZHVjZSgoaGVhZGVycywgbmFtZSkgPT4gaGVhZGVycy5zZXQobmFtZSwgdXBkYXRlLnNldEhlYWRlcnMhW25hbWVdKSwgaGVhZGVycyk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgd2hldGhlciB0aGUgY2FsbGVyIGhhcyBhc2tlZCB0byBzZXQgcGFyYW1zLlxuICAgIGlmICh1cGRhdGUuc2V0UGFyYW1zKSB7XG4gICAgICAvLyBTZXQgZXZlcnkgcmVxdWVzdGVkIHBhcmFtLlxuICAgICAgcGFyYW1zID0gT2JqZWN0LmtleXModXBkYXRlLnNldFBhcmFtcylcbiAgICAgICAgICAgICAgICAgICAucmVkdWNlKChwYXJhbXMsIHBhcmFtKSA9PiBwYXJhbXMuc2V0KHBhcmFtLCB1cGRhdGUuc2V0UGFyYW1zIVtwYXJhbV0pLCBwYXJhbXMpO1xuICAgIH1cblxuICAgIC8vIEZpbmFsbHksIGNvbnN0cnVjdCB0aGUgbmV3IEh0dHBSZXF1ZXN0IHVzaW5nIHRoZSBwaWVjZXMgZnJvbSBhYm92ZS5cbiAgICByZXR1cm4gbmV3IEh0dHBSZXF1ZXN0KG1ldGhvZCwgdXJsLCBib2R5LCB7XG4gICAgICBwYXJhbXMsXG4gICAgICBoZWFkZXJzLFxuICAgICAgY29udGV4dCxcbiAgICAgIHJlcG9ydFByb2dyZXNzLFxuICAgICAgcmVzcG9uc2VUeXBlLFxuICAgICAgd2l0aENyZWRlbnRpYWxzLFxuICAgIH0pO1xuICB9XG59XG4iXX0=