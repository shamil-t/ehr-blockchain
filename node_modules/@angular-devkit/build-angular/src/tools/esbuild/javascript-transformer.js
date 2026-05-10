"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _JavaScriptTransformer_workerPool, _JavaScriptTransformer_commonOptions;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavaScriptTransformer = void 0;
const piscina_1 = __importDefault(require("piscina"));
/**
 * A class that performs transformation of JavaScript files and raw data.
 * A worker pool is used to distribute the transformation actions and allow
 * parallel processing. Transformation behavior is based on the filename and
 * data. Transformations may include: async downleveling, Angular linking,
 * and advanced optimizations.
 */
class JavaScriptTransformer {
    constructor(options, maxThreads) {
        _JavaScriptTransformer_workerPool.set(this, void 0);
        _JavaScriptTransformer_commonOptions.set(this, void 0);
        __classPrivateFieldSet(this, _JavaScriptTransformer_workerPool, new piscina_1.default({
            filename: require.resolve('./javascript-transformer-worker'),
            maxThreads,
        }), "f");
        // Extract options to ensure only the named options are serialized and sent to the worker
        const { sourcemap, thirdPartySourcemaps = false, advancedOptimizations = false, jit = false, } = options;
        __classPrivateFieldSet(this, _JavaScriptTransformer_commonOptions, {
            sourcemap,
            thirdPartySourcemaps,
            advancedOptimizations,
            jit,
        }, "f");
    }
    /**
     * Performs JavaScript transformations on a file from the filesystem.
     * If no transformations are required, the data for the original file will be returned.
     * @param filename The full path to the file.
     * @param skipLinker If true, bypass all Angular linker processing; if false, attempt linking.
     * @returns A promise that resolves to a UTF-8 encoded Uint8Array containing the result.
     */
    transformFile(filename, skipLinker) {
        // Always send the request to a worker. Files are almost always from node modules which means
        // they may need linking. The data is also not yet available to perform most transformation checks.
        return __classPrivateFieldGet(this, _JavaScriptTransformer_workerPool, "f").run({
            filename,
            skipLinker,
            ...__classPrivateFieldGet(this, _JavaScriptTransformer_commonOptions, "f"),
        });
    }
    /**
     * Performs JavaScript transformations on the provided data of a file. The file does not need
     * to exist on the filesystem.
     * @param filename The full path of the file represented by the data.
     * @param data The data of the file that should be transformed.
     * @param skipLinker If true, bypass all Angular linker processing; if false, attempt linking.
     * @returns A promise that resolves to a UTF-8 encoded Uint8Array containing the result.
     */
    async transformData(filename, data, skipLinker) {
        // Perform a quick test to determine if the data needs any transformations.
        // This allows directly returning the data without the worker communication overhead.
        if (skipLinker && !__classPrivateFieldGet(this, _JavaScriptTransformer_commonOptions, "f").advancedOptimizations) {
            const keepSourcemap = __classPrivateFieldGet(this, _JavaScriptTransformer_commonOptions, "f").sourcemap &&
                (!!__classPrivateFieldGet(this, _JavaScriptTransformer_commonOptions, "f").thirdPartySourcemaps || !/[\\/]node_modules[\\/]/.test(filename));
            return Buffer.from(keepSourcemap ? data : data.replace(/^\/\/# sourceMappingURL=[^\r\n]*/gm, ''), 'utf-8');
        }
        return __classPrivateFieldGet(this, _JavaScriptTransformer_workerPool, "f").run({
            filename,
            data,
            skipLinker,
            ...__classPrivateFieldGet(this, _JavaScriptTransformer_commonOptions, "f"),
        });
    }
    /**
     * Stops all active transformation tasks and shuts down all workers.
     * @returns A void promise that resolves when closing is complete.
     */
    close() {
        return __classPrivateFieldGet(this, _JavaScriptTransformer_workerPool, "f").destroy();
    }
}
exports.JavaScriptTransformer = JavaScriptTransformer;
_JavaScriptTransformer_workerPool = new WeakMap(), _JavaScriptTransformer_commonOptions = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiamF2YXNjcmlwdC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3Rvb2xzL2VzYnVpbGQvamF2YXNjcmlwdC10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCxzREFBOEI7QUFZOUI7Ozs7OztHQU1HO0FBQ0gsTUFBYSxxQkFBcUI7SUFJaEMsWUFBWSxPQUFxQyxFQUFFLFVBQW1CO1FBSHRFLG9EQUFxQjtRQUNyQix1REFBdUQ7UUFHckQsdUJBQUEsSUFBSSxxQ0FBZSxJQUFJLGlCQUFPLENBQUM7WUFDN0IsUUFBUSxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsaUNBQWlDLENBQUM7WUFDNUQsVUFBVTtTQUNYLENBQUMsTUFBQSxDQUFDO1FBRUgseUZBQXlGO1FBQ3pGLE1BQU0sRUFDSixTQUFTLEVBQ1Qsb0JBQW9CLEdBQUcsS0FBSyxFQUM1QixxQkFBcUIsR0FBRyxLQUFLLEVBQzdCLEdBQUcsR0FBRyxLQUFLLEdBQ1osR0FBRyxPQUFPLENBQUM7UUFDWix1QkFBQSxJQUFJLHdDQUFrQjtZQUNwQixTQUFTO1lBQ1Qsb0JBQW9CO1lBQ3BCLHFCQUFxQjtZQUNyQixHQUFHO1NBQ0osTUFBQSxDQUFDO0lBQ0osQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILGFBQWEsQ0FBQyxRQUFnQixFQUFFLFVBQW9CO1FBQ2xELDZGQUE2RjtRQUM3RixtR0FBbUc7UUFDbkcsT0FBTyx1QkFBQSxJQUFJLHlDQUFZLENBQUMsR0FBRyxDQUFDO1lBQzFCLFFBQVE7WUFDUixVQUFVO1lBQ1YsR0FBRyx1QkFBQSxJQUFJLDRDQUFlO1NBQ3ZCLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLGFBQWEsQ0FBQyxRQUFnQixFQUFFLElBQVksRUFBRSxVQUFtQjtRQUNyRSwyRUFBMkU7UUFDM0UscUZBQXFGO1FBQ3JGLElBQUksVUFBVSxJQUFJLENBQUMsdUJBQUEsSUFBSSw0Q0FBZSxDQUFDLHFCQUFxQixFQUFFO1lBQzVELE1BQU0sYUFBYSxHQUNqQix1QkFBQSxJQUFJLDRDQUFlLENBQUMsU0FBUztnQkFDN0IsQ0FBQyxDQUFDLENBQUMsdUJBQUEsSUFBSSw0Q0FBZSxDQUFDLG9CQUFvQixJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFFM0YsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUNoQixhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxvQ0FBb0MsRUFBRSxFQUFFLENBQUMsRUFDN0UsT0FBTyxDQUNSLENBQUM7U0FDSDtRQUVELE9BQU8sdUJBQUEsSUFBSSx5Q0FBWSxDQUFDLEdBQUcsQ0FBQztZQUMxQixRQUFRO1lBQ1IsSUFBSTtZQUNKLFVBQVU7WUFDVixHQUFHLHVCQUFBLElBQUksNENBQWU7U0FDdkIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUs7UUFDSCxPQUFPLHVCQUFBLElBQUkseUNBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNwQyxDQUFDO0NBQ0Y7QUEvRUQsc0RBK0VDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCBQaXNjaW5hIGZyb20gJ3Bpc2NpbmEnO1xuXG4vKipcbiAqIFRyYW5zZm9ybWF0aW9uIG9wdGlvbnMgdGhhdCBzaG91bGQgYXBwbHkgdG8gYWxsIHRyYW5zZm9ybWVkIGZpbGVzIGFuZCBkYXRhLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEphdmFTY3JpcHRUcmFuc2Zvcm1lck9wdGlvbnMge1xuICBzb3VyY2VtYXA6IGJvb2xlYW47XG4gIHRoaXJkUGFydHlTb3VyY2VtYXBzPzogYm9vbGVhbjtcbiAgYWR2YW5jZWRPcHRpbWl6YXRpb25zPzogYm9vbGVhbjtcbiAgaml0PzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBBIGNsYXNzIHRoYXQgcGVyZm9ybXMgdHJhbnNmb3JtYXRpb24gb2YgSmF2YVNjcmlwdCBmaWxlcyBhbmQgcmF3IGRhdGEuXG4gKiBBIHdvcmtlciBwb29sIGlzIHVzZWQgdG8gZGlzdHJpYnV0ZSB0aGUgdHJhbnNmb3JtYXRpb24gYWN0aW9ucyBhbmQgYWxsb3dcbiAqIHBhcmFsbGVsIHByb2Nlc3NpbmcuIFRyYW5zZm9ybWF0aW9uIGJlaGF2aW9yIGlzIGJhc2VkIG9uIHRoZSBmaWxlbmFtZSBhbmRcbiAqIGRhdGEuIFRyYW5zZm9ybWF0aW9ucyBtYXkgaW5jbHVkZTogYXN5bmMgZG93bmxldmVsaW5nLCBBbmd1bGFyIGxpbmtpbmcsXG4gKiBhbmQgYWR2YW5jZWQgb3B0aW1pemF0aW9ucy5cbiAqL1xuZXhwb3J0IGNsYXNzIEphdmFTY3JpcHRUcmFuc2Zvcm1lciB7XG4gICN3b3JrZXJQb29sOiBQaXNjaW5hO1xuICAjY29tbW9uT3B0aW9uczogUmVxdWlyZWQ8SmF2YVNjcmlwdFRyYW5zZm9ybWVyT3B0aW9ucz47XG5cbiAgY29uc3RydWN0b3Iob3B0aW9uczogSmF2YVNjcmlwdFRyYW5zZm9ybWVyT3B0aW9ucywgbWF4VGhyZWFkcz86IG51bWJlcikge1xuICAgIHRoaXMuI3dvcmtlclBvb2wgPSBuZXcgUGlzY2luYSh7XG4gICAgICBmaWxlbmFtZTogcmVxdWlyZS5yZXNvbHZlKCcuL2phdmFzY3JpcHQtdHJhbnNmb3JtZXItd29ya2VyJyksXG4gICAgICBtYXhUaHJlYWRzLFxuICAgIH0pO1xuXG4gICAgLy8gRXh0cmFjdCBvcHRpb25zIHRvIGVuc3VyZSBvbmx5IHRoZSBuYW1lZCBvcHRpb25zIGFyZSBzZXJpYWxpemVkIGFuZCBzZW50IHRvIHRoZSB3b3JrZXJcbiAgICBjb25zdCB7XG4gICAgICBzb3VyY2VtYXAsXG4gICAgICB0aGlyZFBhcnR5U291cmNlbWFwcyA9IGZhbHNlLFxuICAgICAgYWR2YW5jZWRPcHRpbWl6YXRpb25zID0gZmFsc2UsXG4gICAgICBqaXQgPSBmYWxzZSxcbiAgICB9ID0gb3B0aW9ucztcbiAgICB0aGlzLiNjb21tb25PcHRpb25zID0ge1xuICAgICAgc291cmNlbWFwLFxuICAgICAgdGhpcmRQYXJ0eVNvdXJjZW1hcHMsXG4gICAgICBhZHZhbmNlZE9wdGltaXphdGlvbnMsXG4gICAgICBqaXQsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyBKYXZhU2NyaXB0IHRyYW5zZm9ybWF0aW9ucyBvbiBhIGZpbGUgZnJvbSB0aGUgZmlsZXN5c3RlbS5cbiAgICogSWYgbm8gdHJhbnNmb3JtYXRpb25zIGFyZSByZXF1aXJlZCwgdGhlIGRhdGEgZm9yIHRoZSBvcmlnaW5hbCBmaWxlIHdpbGwgYmUgcmV0dXJuZWQuXG4gICAqIEBwYXJhbSBmaWxlbmFtZSBUaGUgZnVsbCBwYXRoIHRvIHRoZSBmaWxlLlxuICAgKiBAcGFyYW0gc2tpcExpbmtlciBJZiB0cnVlLCBieXBhc3MgYWxsIEFuZ3VsYXIgbGlua2VyIHByb2Nlc3Npbmc7IGlmIGZhbHNlLCBhdHRlbXB0IGxpbmtpbmcuXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGEgVVRGLTggZW5jb2RlZCBVaW50OEFycmF5IGNvbnRhaW5pbmcgdGhlIHJlc3VsdC5cbiAgICovXG4gIHRyYW5zZm9ybUZpbGUoZmlsZW5hbWU6IHN0cmluZywgc2tpcExpbmtlcj86IGJvb2xlYW4pOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgICAvLyBBbHdheXMgc2VuZCB0aGUgcmVxdWVzdCB0byBhIHdvcmtlci4gRmlsZXMgYXJlIGFsbW9zdCBhbHdheXMgZnJvbSBub2RlIG1vZHVsZXMgd2hpY2ggbWVhbnNcbiAgICAvLyB0aGV5IG1heSBuZWVkIGxpbmtpbmcuIFRoZSBkYXRhIGlzIGFsc28gbm90IHlldCBhdmFpbGFibGUgdG8gcGVyZm9ybSBtb3N0IHRyYW5zZm9ybWF0aW9uIGNoZWNrcy5cbiAgICByZXR1cm4gdGhpcy4jd29ya2VyUG9vbC5ydW4oe1xuICAgICAgZmlsZW5hbWUsXG4gICAgICBza2lwTGlua2VyLFxuICAgICAgLi4udGhpcy4jY29tbW9uT3B0aW9ucyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyBKYXZhU2NyaXB0IHRyYW5zZm9ybWF0aW9ucyBvbiB0aGUgcHJvdmlkZWQgZGF0YSBvZiBhIGZpbGUuIFRoZSBmaWxlIGRvZXMgbm90IG5lZWRcbiAgICogdG8gZXhpc3Qgb24gdGhlIGZpbGVzeXN0ZW0uXG4gICAqIEBwYXJhbSBmaWxlbmFtZSBUaGUgZnVsbCBwYXRoIG9mIHRoZSBmaWxlIHJlcHJlc2VudGVkIGJ5IHRoZSBkYXRhLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgZGF0YSBvZiB0aGUgZmlsZSB0aGF0IHNob3VsZCBiZSB0cmFuc2Zvcm1lZC5cbiAgICogQHBhcmFtIHNraXBMaW5rZXIgSWYgdHJ1ZSwgYnlwYXNzIGFsbCBBbmd1bGFyIGxpbmtlciBwcm9jZXNzaW5nOyBpZiBmYWxzZSwgYXR0ZW1wdCBsaW5raW5nLlxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgdGhhdCByZXNvbHZlcyB0byBhIFVURi04IGVuY29kZWQgVWludDhBcnJheSBjb250YWluaW5nIHRoZSByZXN1bHQuXG4gICAqL1xuICBhc3luYyB0cmFuc2Zvcm1EYXRhKGZpbGVuYW1lOiBzdHJpbmcsIGRhdGE6IHN0cmluZywgc2tpcExpbmtlcjogYm9vbGVhbik6IFByb21pc2U8VWludDhBcnJheT4ge1xuICAgIC8vIFBlcmZvcm0gYSBxdWljayB0ZXN0IHRvIGRldGVybWluZSBpZiB0aGUgZGF0YSBuZWVkcyBhbnkgdHJhbnNmb3JtYXRpb25zLlxuICAgIC8vIFRoaXMgYWxsb3dzIGRpcmVjdGx5IHJldHVybmluZyB0aGUgZGF0YSB3aXRob3V0IHRoZSB3b3JrZXIgY29tbXVuaWNhdGlvbiBvdmVyaGVhZC5cbiAgICBpZiAoc2tpcExpbmtlciAmJiAhdGhpcy4jY29tbW9uT3B0aW9ucy5hZHZhbmNlZE9wdGltaXphdGlvbnMpIHtcbiAgICAgIGNvbnN0IGtlZXBTb3VyY2VtYXAgPVxuICAgICAgICB0aGlzLiNjb21tb25PcHRpb25zLnNvdXJjZW1hcCAmJlxuICAgICAgICAoISF0aGlzLiNjb21tb25PcHRpb25zLnRoaXJkUGFydHlTb3VyY2VtYXBzIHx8ICEvW1xcXFwvXW5vZGVfbW9kdWxlc1tcXFxcL10vLnRlc3QoZmlsZW5hbWUpKTtcblxuICAgICAgcmV0dXJuIEJ1ZmZlci5mcm9tKFxuICAgICAgICBrZWVwU291cmNlbWFwID8gZGF0YSA6IGRhdGEucmVwbGFjZSgvXlxcL1xcLyMgc291cmNlTWFwcGluZ1VSTD1bXlxcclxcbl0qL2dtLCAnJyksXG4gICAgICAgICd1dGYtOCcsXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLiN3b3JrZXJQb29sLnJ1bih7XG4gICAgICBmaWxlbmFtZSxcbiAgICAgIGRhdGEsXG4gICAgICBza2lwTGlua2VyLFxuICAgICAgLi4udGhpcy4jY29tbW9uT3B0aW9ucyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wcyBhbGwgYWN0aXZlIHRyYW5zZm9ybWF0aW9uIHRhc2tzIGFuZCBzaHV0cyBkb3duIGFsbCB3b3JrZXJzLlxuICAgKiBAcmV0dXJucyBBIHZvaWQgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gY2xvc2luZyBpcyBjb21wbGV0ZS5cbiAgICovXG4gIGNsb3NlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLiN3b3JrZXJQb29sLmRlc3Ryb3koKTtcbiAgfVxufVxuIl19