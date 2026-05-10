/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, Injectable, ɵformatRuntimeError as formatRuntimeError } from '@angular/core';
import { DOCUMENT } from '../../dom_tokens';
import { assertDevMode } from './asserts';
import { imgDirectiveDetails } from './error_helper';
import { getUrl } from './url';
import * as i0 from "@angular/core";
/**
 * Observer that detects whether an image with `NgOptimizedImage`
 * is treated as a Largest Contentful Paint (LCP) element. If so,
 * asserts that the image has the `priority` attribute.
 *
 * Note: this is a dev-mode only class and it does not appear in prod bundles,
 * thus there is no `ngDevMode` use in the code.
 *
 * Based on https://web.dev/lcp/#measure-lcp-in-javascript.
 */
export class LCPImageObserver {
    constructor() {
        // Map of full image URLs -> original `ngSrc` values.
        this.images = new Map();
        this.window = null;
        this.observer = null;
        assertDevMode('LCP checker');
        const win = inject(DOCUMENT).defaultView;
        if (typeof win !== 'undefined' && typeof PerformanceObserver !== 'undefined') {
            this.window = win;
            this.observer = this.initPerformanceObserver();
        }
    }
    /**
     * Inits PerformanceObserver and subscribes to LCP events.
     * Based on https://web.dev/lcp/#measure-lcp-in-javascript
     */
    initPerformanceObserver() {
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            if (entries.length === 0)
                return;
            // We use the latest entry produced by the `PerformanceObserver` as the best
            // signal on which element is actually an LCP one. As an example, the first image to load on
            // a page, by virtue of being the only thing on the page so far, is often a LCP candidate
            // and gets reported by PerformanceObserver, but isn't necessarily the LCP element.
            const lcpElement = entries[entries.length - 1];
            // Cast to `any` due to missing `element` on the `LargestContentfulPaint` type of entry.
            // See https://developer.mozilla.org/en-US/docs/Web/API/LargestContentfulPaint
            const imgSrc = lcpElement.element?.src ?? '';
            // Exclude `data:` and `blob:` URLs, since they are not supported by the directive.
            if (imgSrc.startsWith('data:') || imgSrc.startsWith('blob:'))
                return;
            const img = this.images.get(imgSrc);
            if (!img)
                return;
            if (!img.priority && !img.alreadyWarnedPriority) {
                img.alreadyWarnedPriority = true;
                logMissingPriorityWarning(imgSrc);
            }
            if (img.modified && !img.alreadyWarnedModified) {
                img.alreadyWarnedModified = true;
                logModifiedWarning(imgSrc);
            }
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        return observer;
    }
    registerImage(rewrittenSrc, originalNgSrc, isPriority) {
        if (!this.observer)
            return;
        const newObservedImageState = {
            priority: isPriority,
            modified: false,
            alreadyWarnedModified: false,
            alreadyWarnedPriority: false
        };
        this.images.set(getUrl(rewrittenSrc, this.window).href, newObservedImageState);
    }
    unregisterImage(rewrittenSrc) {
        if (!this.observer)
            return;
        this.images.delete(getUrl(rewrittenSrc, this.window).href);
    }
    updateImage(originalSrc, newSrc) {
        const originalUrl = getUrl(originalSrc, this.window).href;
        const img = this.images.get(originalUrl);
        if (img) {
            img.modified = true;
            this.images.set(getUrl(newSrc, this.window).href, img);
            this.images.delete(originalUrl);
        }
    }
    ngOnDestroy() {
        if (!this.observer)
            return;
        this.observer.disconnect();
        this.images.clear();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: LCPImageObserver, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: LCPImageObserver, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: LCPImageObserver, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return []; } });
function logMissingPriorityWarning(ngSrc) {
    const directiveDetails = imgDirectiveDetails(ngSrc);
    console.warn(formatRuntimeError(2955 /* RuntimeErrorCode.LCP_IMG_MISSING_PRIORITY */, `${directiveDetails} this image is the Largest Contentful Paint (LCP) ` +
        `element but was not marked "priority". This image should be marked ` +
        `"priority" in order to prioritize its loading. ` +
        `To fix this, add the "priority" attribute.`));
}
function logModifiedWarning(ngSrc) {
    const directiveDetails = imgDirectiveDetails(ngSrc);
    console.warn(formatRuntimeError(2964 /* RuntimeErrorCode.LCP_IMG_NGSRC_MODIFIED */, `${directiveDetails} this image is the Largest Contentful Paint (LCP) ` +
        `element and has had its "ngSrc" attribute modified. This can cause ` +
        `slower loading performance. It is recommended not to modify the "ngSrc" ` +
        `property on any image which could be the LCP element.`));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGNwX2ltYWdlX29ic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tbW9uL3NyYy9kaXJlY3RpdmVzL25nX29wdGltaXplZF9pbWFnZS9sY3BfaW1hZ2Vfb2JzZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQWEsbUJBQW1CLElBQUksa0JBQWtCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFdkcsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRzFDLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDeEMsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDbkQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLE9BQU8sQ0FBQzs7QUFTN0I7Ozs7Ozs7OztHQVNHO0FBRUgsTUFBTSxPQUFPLGdCQUFnQjtJQU8zQjtRQU5BLHFEQUFxRDtRQUM3QyxXQUFNLEdBQUcsSUFBSSxHQUFHLEVBQThCLENBQUM7UUFFL0MsV0FBTSxHQUFnQixJQUFJLENBQUM7UUFDM0IsYUFBUSxHQUE2QixJQUFJLENBQUM7UUFHaEQsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzdCLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxXQUFXLENBQUM7UUFDekMsSUFBSSxPQUFPLEdBQUcsS0FBSyxXQUFXLElBQUksT0FBTyxtQkFBbUIsS0FBSyxXQUFXLEVBQUU7WUFDNUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7WUFDbEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztTQUNoRDtJQUNILENBQUM7SUFFRDs7O09BR0c7SUFDSyx1QkFBdUI7UUFDN0IsTUFBTSxRQUFRLEdB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QUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ2pDO0lBQ0gsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVE7WUFBRSxPQUFPO1FBQzNCLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDM0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN0QixDQUFDO3lIQWxGVSxnQkFBZ0I7NkhBQWhCLGdCQUFnQixjQURKLE1BQU07O3NHQUNsQixnQkFBZ0I7a0JBRDVCLFVBQVU7bUJBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOztBQXNGaEMsU0FBUyx5QkFBeUIsQ0FBQyxLQUFhO0lBQzlDLE1BQU0sZ0JBQWdCLEdBQUcsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDcEQsT0FBTyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsdURBRTNCLEdBQUcsZ0JBQWdCLG9EQUFvRDtRQUNuRSxxRUFBcUU7UUFDckUsaURBQWlEO1FBQ2pELDRDQUE0QyxDQUFDLENBQUMsQ0FBQztBQUN6RCxDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxLQUFhO0lBQ3ZDLE1BQU0sZ0JBQWdCLEdBQUcsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDcEQsT0FBTyxDQUFDLElBQUksQ0FBQyxrQkFBa0IscURBRTNCLEdBQUcsZ0JBQWdCLG9EQUFvRDtRQUNuRSxxRUFBcUU7UUFDckUsMEVBQTBFO1FBQzFFLHVEQUF1RCxDQUFDLENBQUMsQ0FBQztBQUNwRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7aW5qZWN0LCBJbmplY3RhYmxlLCBPbkRlc3Ryb3ksIMm1Zm9ybWF0UnVudGltZUVycm9yIGFzIGZvcm1hdFJ1bnRpbWVFcnJvcn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJy4uLy4uL2RvbV90b2tlbnMnO1xuaW1wb3J0IHtSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi8uLi9lcnJvcnMnO1xuXG5pbXBvcnQge2Fzc2VydERldk1vZGV9IGZyb20gJy4vYXNzZXJ0cyc7XG5pbXBvcnQge2ltZ0RpcmVjdGl2ZURldGFpbHN9IGZyb20gJy4vZXJyb3JfaGVscGVyJztcbmltcG9ydCB7Z2V0VXJsfSBmcm9tICcuL3VybCc7XG5cbmludGVyZmFjZSBPYnNlcnZlZEltYWdlU3RhdGUge1xuICBwcmlvcml0eTogYm9vbGVhbjtcbiAgbW9kaWZpZWQ6IGJvb2xlYW47XG4gIGFscmVhZHlXYXJuZWRQcmlvcml0eTogYm9vbGVhbjtcbiAgYWxyZWFkeVdhcm5lZE1vZGlmaWVkOiBib29sZWFuO1xufVxuXG4vKipcbiAqIE9ic2VydmVyIHRoYXQgZGV0ZWN0cyB3aGV0aGVyIGFuIGltYWdlIHdpdGggYE5nT3B0aW1pemVkSW1hZ2VgXG4gKiBpcyB0cmVhdGVkIGFzIGEgTGFyZ2VzdCBDb250ZW50ZnVsIFBhaW50IChMQ1ApIGVsZW1lbnQuIElmIHNvLFxuICogYXNzZXJ0cyB0aGF0IHRoZSBpbWFnZSBoYXMgdGhlIGBwcmlvcml0eWAgYXR0cmlidXRlLlxuICpcbiAqIE5vdGU6IHRoaXMgaXMgYSBkZXYtbW9kZSBvbmx5IGNsYXNzIGFuZCBpdCBkb2VzIG5vdCBhcHBlYXIgaW4gcHJvZCBidW5kbGVzLFxuICogdGh1cyB0aGVyZSBpcyBubyBgbmdEZXZNb2RlYCB1c2UgaW4gdGhlIGNvZGUuXG4gKlxuICogQmFzZWQgb24gaHR0cHM6Ly93ZWIuZGV2L2xjcC8jbWVhc3VyZS1sY3AtaW4tamF2YXNjcmlwdC5cbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgTENQSW1hZ2VPYnNlcnZlciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8vIE1hcCBvZiBmdWxsIGltYWdlIFVSTHMgLT4gb3JpZ2luYWwgYG5nU3JjYCB2YWx1ZXMuXG4gIHByaXZhdGUgaW1hZ2VzID0gbmV3IE1hcDxzdHJpbmcsIE9ic2VydmVkSW1hZ2VTdGF0ZT4oKTtcblxuICBwcml2YXRlIHdpbmRvdzogV2luZG93fG51bGwgPSBudWxsO1xuICBwcml2YXRlIG9ic2VydmVyOiBQZXJmb3JtYW5jZU9ic2VydmVyfG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIGFzc2VydERldk1vZGUoJ0xDUCBjaGVja2VyJyk7XG4gICAgY29uc3Qgd2luID0gaW5qZWN0KERPQ1VNRU5UKS5kZWZhdWx0VmlldztcbiAgICBpZiAodHlwZW9mIHdpbiAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIFBlcmZvcm1hbmNlT2JzZXJ2ZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzLndpbmRvdyA9IHdpbjtcbiAgICAgIHRoaXMub2JzZXJ2ZXIgPSB0aGlzLmluaXRQZXJmb3JtYW5jZU9ic2VydmVyKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRzIFBlcmZvcm1hbmNlT2JzZXJ2ZXIgYW5kIHN1YnNjcmliZXMgdG8gTENQIGV2ZW50cy5cbiAgICogQmFzZWQgb24gaHR0cHM6Ly93ZWIuZGV2L2xjcC8jbWVhc3VyZS1sY3AtaW4tamF2YXNjcmlwdFxuICAgKi9cbiAgcHJpdmF0ZSBpbml0UGVyZm9ybWFuY2VPYnNlcnZlcigpOiBQZXJmb3JtYW5jZU9ic2VydmVyIHtcbiAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBQZXJmb3JtYW5jZU9ic2VydmVyKChlbnRyeUxpc3QpID0+IHtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBlbnRyeUxpc3QuZ2V0RW50cmllcygpO1xuICAgICAgaWYgKGVudHJpZXMubGVuZ3RoID09PSAwKSByZXR1cm47XG4gICAgICAvLyBXZSB1c2UgdGhlIGxhdGVzdCBlbnRyeSBwcm9kdWNlZCBieSB0aGUgYFBlcmZvcm1hbmNlT2JzZXJ2ZXJgIGFzIHRoZSBiZXN0XG4gICAgICAvLyBzaWduYWwgb24gd2hpY2ggZWxlbWVudCBpcyBhY3R1YWxseSBhbiBMQ1Agb25lLiBBcyBhbiBleGFtcGxlLCB0aGUgZmlyc3QgaW1hZ2UgdG8gbG9hZCBvblxuICAgICAgLy8gYSBwYWdlLCBieSB2aXJ0dWUgb2YgYmVpbmcgdGhlIG9ubHkgdGhpbmcgb24gdGhlIHBhZ2Ugc28gZmFyLCBpcyBvZnRlbiBhIExDUCBjYW5kaWRhdGVcbiAgICAgIC8vIGFuZCBnZXRzIHJlcG9ydGVkIGJ5IFBlcmZvcm1hbmNlT2JzZXJ2ZXIsIGJ1dCBpc24ndCBuZWNlc3NhcmlseSB0aGUgTENQIGVsZW1lbnQuXG4gICAgICBjb25zdCBsY3BFbGVtZW50ID0gZW50cmllc1tlbnRyaWVzLmxlbmd0aCAtIDFdO1xuXG4gICAgICAvLyBDYXN0IHRvIGBhbnlgIGR1ZSB0byBtaXNzaW5nIGBlbGVtZW50YCBvbiB0aGUgYExhcmdlc3RDb250ZW50ZnVsUGFpbnRgIHR5cGUgb2YgZW50cnkuXG4gICAgICAvLyBTZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0xhcmdlc3RDb250ZW50ZnVsUGFpbnRcbiAgICAgIGNvbnN0IGltZ1NyYyA9IChsY3BFbGVtZW50IGFzIGFueSkuZWxlbWVudD8uc3JjID8/ICcnO1xuXG4gICAgICAvLyBFeGNsdWRlIGBkYXRhOmAgYW5kIGBibG9iOmAgVVJMcywgc2luY2UgdGhleSBhcmUgbm90IHN1cHBvcnRlZCBieSB0aGUgZGlyZWN0aXZlLlxuICAgICAgaWYgKGltZ1NyYy5zdGFydHNXaXRoKCdkYXRhOicpIHx8IGltZ1NyYy5zdGFydHNXaXRoKCdibG9iOicpKSByZXR1cm47XG5cbiAgICAgIGNvbnN0IGltZyA9IHRoaXMuaW1hZ2VzLmdldChpbWdTcmMpO1xuICAgICAgaWYgKCFpbWcpIHJldHVybjtcbiAgICAgIGlmICghaW1nLnByaW9yaXR5ICYmICFpbWcuYWxyZWFkeVdhcm5lZFByaW9yaXR5KSB7XG4gICAgICAgIGltZy5hbHJlYWR5V2FybmVkUHJpb3JpdHkgPSB0cnVlO1xuICAgICAgICBsb2dNaXNzaW5nUHJpb3JpdHlXYXJuaW5nKGltZ1NyYyk7XG4gICAgICB9XG4gICAgICBpZiAoaW1nLm1vZGlmaWVkICYmICFpbWcuYWxyZWFkeVdhcm5lZE1vZGlmaWVkKSB7XG4gICAgICAgIGltZy5hbHJlYWR5V2FybmVkTW9kaWZpZWQgPSB0cnVlO1xuICAgICAgICBsb2dNb2RpZmllZFdhcm5pbmcoaW1nU3JjKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKHt0eXBlOiAnbGFyZ2VzdC1jb250ZW50ZnVsLXBhaW50JywgYnVmZmVyZWQ6IHRydWV9KTtcbiAgICByZXR1cm4gb2JzZXJ2ZXI7XG4gIH1cblxuICByZWdpc3RlckltYWdlKHJld3JpdHRlblNyYzogc3RyaW5nLCBvcmlnaW5hbE5nU3JjOiBzdHJpbmcsIGlzUHJpb3JpdHk6IGJvb2xlYW4pIHtcbiAgICBpZiAoIXRoaXMub2JzZXJ2ZXIpIHJldHVybjtcbiAgICBjb25zdCBuZXdPYnNlcnZlZEltYWdlU3RhdGU6IE9ic2VydmVkSW1hZ2VTdGF0ZSA9IHtcbiAgICAgIHByaW9yaXR5OiBpc1ByaW9yaXR5LFxuICAgICAgbW9kaWZpZWQ6IGZhbHNlLFxuICAgICAgYWxyZWFkeVdhcm5lZE1vZGlmaWVkOiBmYWxzZSxcbiAgICAgIGFscmVhZHlXYXJuZWRQcmlvcml0eTogZmFsc2VcbiAgICB9O1xuICAgIHRoaXMuaW1hZ2VzLnNldChnZXRVcmwocmV3cml0dGVuU3JjLCB0aGlzLndpbmRvdyEpLmhyZWYsIG5ld09ic2VydmVkSW1hZ2VTdGF0ZSk7XG4gIH1cblxuICB1bnJlZ2lzdGVySW1hZ2UocmV3cml0dGVuU3JjOiBzdHJpbmcpIHtcbiAgICBpZiAoIXRoaXMub2JzZXJ2ZXIpIHJldHVybjtcbiAgICB0aGlzLmltYWdlcy5kZWxldGUoZ2V0VXJsKHJld3JpdHRlblNyYywgdGhpcy53aW5kb3chKS5ocmVmKTtcbiAgfVxuXG4gIHVwZGF0ZUltYWdlKG9yaWdpbmFsU3JjOiBzdHJpbmcsIG5ld1NyYzogc3RyaW5nKSB7XG4gICAgY29uc3Qgb3JpZ2luYWxVcmwgPSBnZXRVcmwob3JpZ2luYWxTcmMsIHRoaXMud2luZG93ISkuaHJlZjtcbiAgICBjb25zdCBpbWcgPSB0aGlzLmltYWdlcy5nZXQob3JpZ2luYWxVcmwpO1xuICAgIGlmIChpbWcpIHtcbiAgICAgIGltZy5tb2RpZmllZCA9IHRydWU7XG4gICAgICB0aGlzLmltYWdlcy5zZXQoZ2V0VXJsKG5ld1NyYywgdGhpcy53aW5kb3chKS5ocmVmLCBpbWcpO1xuICAgICAgdGhpcy5pbWFnZXMuZGVsZXRlKG9yaWdpbmFsVXJsKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBpZiAoIXRoaXMub2JzZXJ2ZXIpIHJldHVybjtcbiAgICB0aGlzLm9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICB0aGlzLmltYWdlcy5jbGVhcigpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGxvZ01pc3NpbmdQcmlvcml0eVdhcm5pbmcobmdTcmM6IHN0cmluZykge1xuICBjb25zdCBkaXJlY3RpdmVEZXRhaWxzID0gaW1nRGlyZWN0aXZlRGV0YWlscyhuZ1NyYyk7XG4gIGNvbnNvbGUud2Fybihmb3JtYXRSdW50aW1lRXJyb3IoXG4gICAgICBSdW50aW1lRXJyb3JDb2RlLkxDUF9JTUdfTUlTU0lOR19QUklPUklUWSxcbiAgICAgIGAke2RpcmVjdGl2ZURldGFpbHN9IHRoaXMgaW1hZ2UgaXMgdGhlIExhcmdlc3QgQ29udGVudGZ1bCBQYWludCAoTENQKSBgICtcbiAgICAgICAgICBgZWxlbWVudCBidXQgd2FzIG5vdCBtYXJrZWQgXCJwcmlvcml0eVwiLiBUaGlzIGltYWdlIHNob3VsZCBiZSBtYXJrZWQgYCArXG4gICAgICAgICAgYFwicHJpb3JpdHlcIiBpbiBvcmRlciB0byBwcmlvcml0aXplIGl0cyBsb2FkaW5nLiBgICtcbiAgICAgICAgICBgVG8gZml4IHRoaXMsIGFkZCB0aGUgXCJwcmlvcml0eVwiIGF0dHJpYnV0ZS5gKSk7XG59XG5cbmZ1bmN0aW9uIGxvZ01vZGlmaWVkV2FybmluZyhuZ1NyYzogc3RyaW5nKSB7XG4gIGNvbnN0IGRpcmVjdGl2ZURldGFpbHMgPSBpbWdEaXJlY3RpdmVEZXRhaWxzKG5nU3JjKTtcbiAgY29uc29sZS53YXJuKGZvcm1hdFJ1bnRpbWVFcnJvcihcbiAgICAgIFJ1bnRpbWVFcnJvckNvZGUuTENQX0lNR19OR1NSQ19NT0RJRklFRCxcbiAgICAgIGAke2RpcmVjdGl2ZURldGFpbHN9IHRoaXMgaW1hZ2UgaXMgdGhlIExhcmdlc3QgQ29udGVudGZ1bCBQYWludCAoTENQKSBgICtcbiAgICAgICAgICBgZWxlbWVudCBhbmQgaGFzIGhhZCBpdHMgXCJuZ1NyY1wiIGF0dHJpYnV0ZSBtb2RpZmllZC4gVGhpcyBjYW4gY2F1c2UgYCArXG4gICAgICAgICAgYHNsb3dlciBsb2FkaW5nIHBlcmZvcm1hbmNlLiBJdCBpcyByZWNvbW1lbmRlZCBub3QgdG8gbW9kaWZ5IHRoZSBcIm5nU3JjXCIgYCArXG4gICAgICAgICAgYHByb3BlcnR5IG9uIGFueSBpbWFnZSB3aGljaCBjb3VsZCBiZSB0aGUgTENQIGVsZW1lbnQuYCkpO1xufVxuIl19