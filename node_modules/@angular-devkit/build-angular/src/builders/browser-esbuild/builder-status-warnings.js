"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logBuilderStatusWarnings = void 0;
const UNSUPPORTED_OPTIONS = [
    'budgets',
    // * i18n support
    'localize',
    // The following two have no effect when localize is not enabled
    // 'i18nDuplicateTranslation',
    // 'i18nMissingTranslation',
    // * Deprecated
    'deployUrl',
    // * Always enabled with esbuild
    // 'commonChunk',
    // * Unused by builder and will be removed in a future release
    'namedChunks',
    'vendorChunk',
    'resourcesOutputPath',
    // * Currently unsupported by esbuild
    'webWorkerTsConfig',
];
function logBuilderStatusWarnings(options, context) {
    context.logger.warn(`The esbuild-based browser application builder ('browser-esbuild') is currently in developer preview` +
        ' and is not yet recommended for production use.' +
        ' For additional information, please see https://angular.io/guide/esbuild');
    // Validate supported options
    for (const unsupportedOption of UNSUPPORTED_OPTIONS) {
        const value = options[unsupportedOption];
        if (value === undefined || value === false) {
            continue;
        }
        if (Array.isArray(value) && value.length === 0) {
            continue;
        }
        if (typeof value === 'object' && Object.keys(value).length === 0) {
            continue;
        }
        if (unsupportedOption === 'namedChunks' ||
            unsupportedOption === 'vendorChunk' ||
            unsupportedOption === 'resourcesOutputPath' ||
            unsupportedOption === 'deployUrl') {
            context.logger.warn(`The '${unsupportedOption}' option is not used by this builder and will be ignored.`);
            continue;
        }
        context.logger.warn(`The '${unsupportedOption}' option is not yet supported by this builder.`);
    }
}
exports.logBuilderStatusWarnings = logBuilderStatusWarnings;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGRlci1zdGF0dXMtd2FybmluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9icm93c2VyLWVzYnVpbGQvYnVpbGRlci1zdGF0dXMtd2FybmluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBS0gsTUFBTSxtQkFBbUIsR0FBdUM7SUFDOUQsU0FBUztJQUVULGlCQUFpQjtJQUNqQixVQUFVO0lBQ1YsZ0VBQWdFO0lBQ2hFLDhCQUE4QjtJQUM5Qiw0QkFBNEI7SUFFNUIsZUFBZTtJQUNmLFdBQVc7SUFFWCxnQ0FBZ0M7SUFDaEMsaUJBQWlCO0lBRWpCLDhEQUE4RDtJQUM5RCxhQUFhO0lBQ2IsYUFBYTtJQUNiLHFCQUFxQjtJQUVyQixxQ0FBcUM7SUFDckMsbUJBQW1CO0NBQ3BCLENBQUM7QUFFRixTQUFnQix3QkFBd0IsQ0FBQyxPQUE4QixFQUFFLE9BQXVCO0lBQzlGLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUNqQixxR0FBcUc7UUFDbkcsaURBQWlEO1FBQ2pELDBFQUEwRSxDQUM3RSxDQUFDO0lBRUYsNkJBQTZCO0lBQzdCLEtBQUssTUFBTSxpQkFBaUIsSUFBSSxtQkFBbUIsRUFBRTtRQUNuRCxNQUFNLEtBQUssR0FBSSxPQUE0QyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFFL0UsSUFBSSxLQUFLLEtBQUssU0FBUyxJQUFJLEtBQUssS0FBSyxLQUFLLEVBQUU7WUFDMUMsU0FBUztTQUNWO1FBQ0QsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQzlDLFNBQVM7U0FDVjtRQUNELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUNoRSxTQUFTO1NBQ1Y7UUFFRCxJQUNFLGlCQUFpQixLQUFLLGFBQWE7WUFDbkMsaUJBQWlCLEtBQUssYUFBYTtZQUNuQyxpQkFBaUIsS0FBSyxxQkFBcUI7WUFDM0MsaUJBQWlCLEtBQUssV0FBVyxFQUNqQztZQUNBLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUNqQixRQUFRLGlCQUFpQiwyREFBMkQsQ0FDckYsQ0FBQztZQUNGLFNBQVM7U0FDVjtRQUVELE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsaUJBQWlCLGdEQUFnRCxDQUFDLENBQUM7S0FDaEc7QUFDSCxDQUFDO0FBbkNELDREQW1DQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBCdWlsZGVyQ29udGV4dCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9hcmNoaXRlY3QnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIEJyb3dzZXJCdWlsZGVyT3B0aW9ucyB9IGZyb20gJy4vc2NoZW1hJztcblxuY29uc3QgVU5TVVBQT1JURURfT1BUSU9OUzogQXJyYXk8a2V5b2YgQnJvd3NlckJ1aWxkZXJPcHRpb25zPiA9IFtcbiAgJ2J1ZGdldHMnLFxuXG4gIC8vICogaTE4biBzdXBwb3J0XG4gICdsb2NhbGl6ZScsXG4gIC8vIFRoZSBmb2xsb3dpbmcgdHdvIGhhdmUgbm8gZWZmZWN0IHdoZW4gbG9jYWxpemUgaXMgbm90IGVuYWJsZWRcbiAgLy8gJ2kxOG5EdXBsaWNhdGVUcmFuc2xhdGlvbicsXG4gIC8vICdpMThuTWlzc2luZ1RyYW5zbGF0aW9uJyxcblxuICAvLyAqIERlcHJlY2F0ZWRcbiAgJ2RlcGxveVVybCcsXG5cbiAgLy8gKiBBbHdheXMgZW5hYmxlZCB3aXRoIGVzYnVpbGRcbiAgLy8gJ2NvbW1vbkNodW5rJyxcblxuICAvLyAqIFVudXNlZCBieSBidWlsZGVyIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gYSBmdXR1cmUgcmVsZWFzZVxuICAnbmFtZWRDaHVua3MnLFxuICAndmVuZG9yQ2h1bmsnLFxuICAncmVzb3VyY2VzT3V0cHV0UGF0aCcsXG5cbiAgLy8gKiBDdXJyZW50bHkgdW5zdXBwb3J0ZWQgYnkgZXNidWlsZFxuICAnd2ViV29ya2VyVHNDb25maWcnLFxuXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGxvZ0J1aWxkZXJTdGF0dXNXYXJuaW5ncyhvcHRpb25zOiBCcm93c2VyQnVpbGRlck9wdGlvbnMsIGNvbnRleHQ6IEJ1aWxkZXJDb250ZXh0KSB7XG4gIGNvbnRleHQubG9nZ2VyLndhcm4oXG4gICAgYFRoZSBlc2J1aWxkLWJhc2VkIGJyb3dzZXIgYXBwbGljYXRpb24gYnVpbGRlciAoJ2Jyb3dzZXItZXNidWlsZCcpIGlzIGN1cnJlbnRseSBpbiBkZXZlbG9wZXIgcHJldmlld2AgK1xuICAgICAgJyBhbmQgaXMgbm90IHlldCByZWNvbW1lbmRlZCBmb3IgcHJvZHVjdGlvbiB1c2UuJyArXG4gICAgICAnIEZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uLCBwbGVhc2Ugc2VlIGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9lc2J1aWxkJyxcbiAgKTtcblxuICAvLyBWYWxpZGF0ZSBzdXBwb3J0ZWQgb3B0aW9uc1xuICBmb3IgKGNvbnN0IHVuc3VwcG9ydGVkT3B0aW9uIG9mIFVOU1VQUE9SVEVEX09QVElPTlMpIHtcbiAgICBjb25zdCB2YWx1ZSA9IChvcHRpb25zIGFzIHVua25vd24gYXMgQnJvd3NlckJ1aWxkZXJPcHRpb25zKVt1bnN1cHBvcnRlZE9wdGlvbl07XG5cbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gZmFsc2UpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgT2JqZWN0LmtleXModmFsdWUpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdW5zdXBwb3J0ZWRPcHRpb24gPT09ICduYW1lZENodW5rcycgfHxcbiAgICAgIHVuc3VwcG9ydGVkT3B0aW9uID09PSAndmVuZG9yQ2h1bmsnIHx8XG4gICAgICB1bnN1cHBvcnRlZE9wdGlvbiA9PT0gJ3Jlc291cmNlc091dHB1dFBhdGgnIHx8XG4gICAgICB1bnN1cHBvcnRlZE9wdGlvbiA9PT0gJ2RlcGxveVVybCdcbiAgICApIHtcbiAgICAgIGNvbnRleHQubG9nZ2VyLndhcm4oXG4gICAgICAgIGBUaGUgJyR7dW5zdXBwb3J0ZWRPcHRpb259JyBvcHRpb24gaXMgbm90IHVzZWQgYnkgdGhpcyBidWlsZGVyIGFuZCB3aWxsIGJlIGlnbm9yZWQuYCxcbiAgICAgICk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb250ZXh0LmxvZ2dlci53YXJuKGBUaGUgJyR7dW5zdXBwb3J0ZWRPcHRpb259JyBvcHRpb24gaXMgbm90IHlldCBzdXBwb3J0ZWQgYnkgdGhpcyBidWlsZGVyLmApO1xuICB9XG59XG4iXX0=