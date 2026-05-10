"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.levenshtein = exports.capitalize = exports.underscore = exports.classify = exports.camelize = exports.dasherize = exports.decamelize = void 0;
const STRING_DASHERIZE_REGEXP = /[ _]/g;
const STRING_DECAMELIZE_REGEXP = /([a-z\d])([A-Z])/g;
const STRING_CAMELIZE_REGEXP = /(-|_|\.|\s)+(.)?/g;
const STRING_UNDERSCORE_REGEXP_1 = /([a-z\d])([A-Z]+)/g;
const STRING_UNDERSCORE_REGEXP_2 = /-|\s+/g;
/**
 * Converts a camelized string into all lower case separated by underscores.
 *
 ```javascript
 decamelize('innerHTML');         // 'inner_html'
 decamelize('action_name');       // 'action_name'
 decamelize('css-class-name');    // 'css-class-name'
 decamelize('my favorite items'); // 'my favorite items'
 ```

 @method decamelize
 @param {String} str The string to decamelize.
 @return {String} the decamelized string.
 */
function decamelize(str) {
    return str.replace(STRING_DECAMELIZE_REGEXP, '$1_$2').toLowerCase();
}
exports.decamelize = decamelize;
/**
 Replaces underscores, spaces, or camelCase with dashes.

 ```javascript
 dasherize('innerHTML');         // 'inner-html'
 dasherize('action_name');       // 'action-name'
 dasherize('css-class-name');    // 'css-class-name'
 dasherize('my favorite items'); // 'my-favorite-items'
 ```

 @method dasherize
 @param {String} str The string to dasherize.
 @return {String} the dasherized string.
 */
function dasherize(str) {
    return decamelize(str).replace(STRING_DASHERIZE_REGEXP, '-');
}
exports.dasherize = dasherize;
/**
 Returns the lowerCamelCase form of a string.

 ```javascript
 camelize('innerHTML');          // 'innerHTML'
 camelize('action_name');        // 'actionName'
 camelize('css-class-name');     // 'cssClassName'
 camelize('my favorite items');  // 'myFavoriteItems'
 camelize('My Favorite Items');  // 'myFavoriteItems'
 ```

 @method camelize
 @param {String} str The string to camelize.
 @return {String} the camelized string.
 */
function camelize(str) {
    return str
        .replace(STRING_CAMELIZE_REGEXP, (_match, _separator, chr) => {
        return chr ? chr.toUpperCase() : '';
    })
        .replace(/^([A-Z])/, (match) => match.toLowerCase());
}
exports.camelize = camelize;
/**
 Returns the UpperCamelCase form of a string.

 @example
 ```javascript
 'innerHTML'.classify();          // 'InnerHTML'
 'action_name'.classify();        // 'ActionName'
 'css-class-name'.classify();     // 'CssClassName'
 'my favorite items'.classify();  // 'MyFavoriteItems'
 'app.component'.classify();      // 'AppComponent'
 ```
 @method classify
 @param {String} str the string to classify
 @return {String} the classified string
 */
function classify(str) {
    return str
        .split('.')
        .map((part) => capitalize(camelize(part)))
        .join('');
}
exports.classify = classify;
/**
 More general than decamelize. Returns the lower_case_and_underscored
 form of a string.

 ```javascript
 'innerHTML'.underscore();          // 'inner_html'
 'action_name'.underscore();        // 'action_name'
 'css-class-name'.underscore();     // 'css_class_name'
 'my favorite items'.underscore();  // 'my_favorite_items'
 ```

 @method underscore
 @param {String} str The string to underscore.
 @return {String} the underscored string.
 */
function underscore(str) {
    return str
        .replace(STRING_UNDERSCORE_REGEXP_1, '$1_$2')
        .replace(STRING_UNDERSCORE_REGEXP_2, '_')
        .toLowerCase();
}
exports.underscore = underscore;
/**
 Returns the Capitalized form of a string

 ```javascript
 'innerHTML'.capitalize()         // 'InnerHTML'
 'action_name'.capitalize()       // 'Action_name'
 'css-class-name'.capitalize()    // 'Css-class-name'
 'my favorite items'.capitalize() // 'My favorite items'
 ```

 @method capitalize
 @param {String} str The string to capitalize.
 @return {String} The capitalized string.
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
exports.capitalize = capitalize;
/**
 * Calculate the levenshtein distance of two strings.
 * See https://en.wikipedia.org/wiki/Levenshtein_distance.
 * Based off https://gist.github.com/andrei-m/982927 (for using the faster dynamic programming
 * version).
 *
 * @param a String a.
 * @param b String b.
 * @returns A number that represents the distance between the two strings. The greater the number
 *   the more distant the strings are from each others.
 */
function levenshtein(a, b) {
    if (a.length == 0) {
        return b.length;
    }
    if (b.length == 0) {
        return a.length;
    }
    const matrix = [];
    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                matrix[i][j - 1] + 1, // insertion
                matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[b.length][a.length];
}
exports.levenshtein = levenshtein;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaW5ncy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvc3JjL3V0aWxzL3N0cmluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsTUFBTSx1QkFBdUIsR0FBRyxPQUFPLENBQUM7QUFDeEMsTUFBTSx3QkFBd0IsR0FBRyxtQkFBbUIsQ0FBQztBQUNyRCxNQUFNLHNCQUFzQixHQUFHLG1CQUFtQixDQUFDO0FBQ25ELE1BQU0sMEJBQTBCLEdBQUcsb0JBQW9CLENBQUM7QUFDeEQsTUFBTSwwQkFBMEIsR0FBRyxRQUFRLENBQUM7QUFFNUM7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILFNBQWdCLFVBQVUsQ0FBQyxHQUFXO0lBQ3BDLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsRUFBRSxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN0RSxDQUFDO0FBRkQsZ0NBRUM7QUFFRDs7Ozs7Ozs7Ozs7OztHQWFHO0FBQ0gsU0FBZ0IsU0FBUyxDQUFDLEdBQVc7SUFDbkMsT0FBTyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLHVCQUF1QixFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQy9ELENBQUM7QUFGRCw4QkFFQztBQUVEOzs7Ozs7Ozs7Ozs7OztHQWNHO0FBQ0gsU0FBZ0IsUUFBUSxDQUFDLEdBQVc7SUFDbEMsT0FBTyxHQUFHO1NBQ1AsT0FBTyxDQUFDLHNCQUFzQixFQUFFLENBQUMsTUFBYyxFQUFFLFVBQWtCLEVBQUUsR0FBVyxFQUFFLEVBQUU7UUFDbkYsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ3RDLENBQUMsQ0FBQztTQUNELE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxLQUFhLEVBQUUs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QUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQ3JCLENBQUM7YUFDSDtTQUNGO0tBQ0Y7SUFFRCxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3BDLENBQUM7QUFwQ0Qsa0NBb0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmNvbnN0IFNUUklOR19EQVNIRVJJWkVfUkVHRVhQID0gL1sgX10vZztcbmNvbnN0IFNUUklOR19ERUNBTUVMSVpFX1JFR0VYUCA9IC8oW2EtelxcZF0pKFtBLVpdKS9nO1xuY29uc3QgU1RSSU5HX0NBTUVMSVpFX1JFR0VYUCA9IC8oLXxffFxcLnxcXHMpKyguKT8vZztcbmNvbnN0IFNUUklOR19VTkRFUlNDT1JFX1JFR0VYUF8xID0gLyhbYS16XFxkXSkoW0EtWl0rKS9nO1xuY29uc3QgU1RSSU5HX1VOREVSU0NPUkVfUkVHRVhQXzIgPSAvLXxcXHMrL2c7XG5cbi8qKlxuICogQ29udmVydHMgYSBjYW1lbGl6ZWQgc3RyaW5nIGludG8gYWxsIGxvd2VyIGNhc2Ugc2VwYXJhdGVkIGJ5IHVuZGVyc2NvcmVzLlxuICpcbiBgYGBqYXZhc2NyaXB0XG4gZGVjYW1lbGl6ZSgnaW5uZXJIVE1MJyk7ICAgICAgICAgLy8gJ2lubmVyX2h0bWwnXG4gZGVjYW1lbGl6ZSgnYWN0aW9uX25hbWUnKTsgICAgICAgLy8gJ2FjdGlvbl9uYW1lJ1xuIGRlY2FtZWxpemUoJ2Nzcy1jbGFzcy1uYW1lJyk7ICAgIC8vICdjc3MtY2xhc3MtbmFtZSdcbiBkZWNhbWVsaXplKCdteSBmYXZvcml0ZSBpdGVtcycpOyAvLyAnbXkgZmF2b3JpdGUgaXRlbXMnXG4gYGBgXG5cbiBAbWV0aG9kIGRlY2FtZWxpemVcbiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdG8gZGVjYW1lbGl6ZS5cbiBAcmV0dXJuIHtTdHJpbmd9IHRoZSBkZWNhbWVsaXplZCBzdHJpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNhbWVsaXplKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKFNUUklOR19ERUNBTUVMSVpFX1JFR0VYUCwgJyQxXyQyJykudG9Mb3dlckNhc2UoKTtcbn1cblxuLyoqXG4gUmVwbGFjZXMgdW5kZXJzY29yZXMsIHNwYWNlcywgb3IgY2FtZWxDYXNlIHdpdGggZGFzaGVzLlxuXG4gYGBgamF2YXNjcmlwdFxuIGRhc2hlcml6ZSgnaW5uZXJIVE1MJyk7ICAgICAgICAgLy8gJ2lubmVyLWh0bWwnXG4gZGFzaGVyaXplKCdhY3Rpb25fbmFtZScpOyAgICAgICAvLyAnYWN0aW9uLW5hbWUnXG4gZGFzaGVyaXplKCdjc3MtY2xhc3MtbmFtZScpOyAgICAvLyAnY3NzLWNsYXNzLW5hbWUnXG4gZGFzaGVyaXplKCdteSBmYXZvcml0ZSBpdGVtcycpOyAvLyAnbXktZmF2b3JpdGUtaXRlbXMnXG4gYGBgXG5cbiBAbWV0aG9kIGRhc2hlcml6ZVxuIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0byBkYXNoZXJpemUuXG4gQHJldHVybiB7U3RyaW5nfSB0aGUgZGFzaGVyaXplZCBzdHJpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkYXNoZXJpemUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gZGVjYW1lbGl6ZShzdHIpLnJlcGxhY2UoU1RSSU5HX0RBU0hFUklaRV9SRUdFWFAsICctJyk7XG59XG5cbi8qKlxuIFJldHVybnMgdGhlIGxvd2VyQ2FtZWxDYXNlIGZvcm0gb2YgYSBzdHJpbmcuXG5cbiBgYGBqYXZhc2NyaXB0XG4gY2FtZWxpemUoJ2lubmVySFRNTCcpOyAgICAgICAgICAvLyAnaW5uZXJIVE1MJ1xuIGNhbWVsaXplKCdhY3Rpb25fbmFtZScpOyAgICAgICAgLy8gJ2FjdGlvbk5hbWUnXG4gY2FtZWxpemUoJ2Nzcy1jbGFzcy1uYW1lJyk7ICAgICAvLyAnY3NzQ2xhc3NOYW1lJ1xuIGNhbWVsaXplKCdteSBmYXZvcml0ZSBpdGVtcycpOyAgLy8gJ215RmF2b3JpdGVJdGVtcydcbiBjYW1lbGl6ZSgnTXkgRmF2b3JpdGUgSXRlbXMnKTsgIC8vICdteUZhdm9yaXRlSXRlbXMnXG4gYGBgXG5cbiBAbWV0aG9kIGNhbWVsaXplXG4gQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIHRvIGNhbWVsaXplLlxuIEByZXR1cm4ge1N0cmluZ30gdGhlIGNhbWVsaXplZCBzdHJpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW1lbGl6ZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzdHJcbiAgICAucmVwbGFjZShTVFJJTkdfQ0FNRUxJWkVfUkVHRVhQLCAoX21hdGNoOiBzdHJpbmcsIF9zZXBhcmF0b3I6IHN0cmluZywgY2hyOiBzdHJpbmcpID0+IHtcbiAgICAgIHJldHVybiBjaHIgPyBjaHIudG9VcHBlckNhc2UoKSA6ICcnO1xuICAgIH0pXG4gICAgLnJlcGxhY2UoL14oW0EtWl0pLywgKG1hdGNoOiBzdHJpbmcpID0+IG1hdGNoLnRvTG93ZXJDYXNlKCkpO1xufVxuXG4vKipcbiBSZXR1cm5zIHRoZSBVcHBlckNhbWVsQ2FzZSBmb3JtIG9mIGEgc3RyaW5nLlxuXG4gQGV4YW1wbGVcbiBgYGBqYXZhc2NyaXB0XG4gJ2lubmVySFRNTCcuY2xhc3NpZnkoKTsgICAgICAgICAgLy8gJ0lubmVySFRNTCdcbiAnYWN0aW9uX25hbWUnLmNsYXNzaWZ5KCk7ICAgICAgICAvLyAnQWN0aW9uTmFtZSdcbiAnY3NzLWNsYXNzLW5hbWUnLmNsYXNzaWZ5KCk7ICAgICAvLyAnQ3NzQ2xhc3NOYW1lJ1xuICdteSBmYXZvcml0ZSBpdGVtcycuY2xhc3NpZnkoKTsgIC8vICdNeUZhdm9yaXRlSXRlbXMnXG4gJ2FwcC5jb21wb25lbnQnLmNsYXNzaWZ5KCk7ICAgICAgLy8gJ0FwcENvbXBvbmVudCdcbiBgYGBcbiBAbWV0aG9kIGNsYXNzaWZ5XG4gQHBhcmFtIHtTdHJpbmd9IHN0ciB0aGUgc3RyaW5nIHRvIGNsYXNzaWZ5XG4gQHJldHVybiB7U3RyaW5nfSB0aGUgY2xhc3NpZmllZCBzdHJpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYXNzaWZ5KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHN0clxuICAgIC5zcGxpdCgnLicpXG4gICAgLm1hcCgocGFydCkgPT4gY2FwaXRhbGl6ZShjYW1lbGl6ZShwYXJ0KSkpXG4gICAgLmpvaW4oJycpO1xufVxuXG4vKipcbiBNb3JlIGdlbmVyYWwgdGhhbiBkZWNhbWVsaXplLiBSZXR1cm5zIHRoZSBsb3dlcl9jYXNlX2FuZF91bmRlcnNjb3JlZFxuIGZvcm0gb2YgYSBzdHJpbmcuXG5cbiBgYGBqYXZhc2NyaXB0XG4gJ2lubmVySFRNTCcudW5kZXJzY29yZSgpOyAgICAgICAgICAvLyAnaW5uZXJfaHRtbCdcbiAnYWN0aW9uX25hbWUnLnVuZGVyc2NvcmUoKTsgICAgICAgIC8vICdhY3Rpb25fbmFtZSdcbiAnY3NzLWNsYXNzLW5hbWUnLnVuZGVyc2NvcmUoKTsgICAgIC8vICdjc3NfY2xhc3NfbmFtZSdcbiAnbXkgZmF2b3JpdGUgaXRlbXMnLnVuZGVyc2NvcmUoKTsgIC8vICdteV9mYXZvcml0ZV9pdGVtcydcbiBgYGBcblxuIEBtZXRob2QgdW5kZXJzY29yZVxuIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0byB1bmRlcnNjb3JlLlxuIEByZXR1cm4ge1N0cmluZ30gdGhlIHVuZGVyc2NvcmVkIHN0cmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVuZGVyc2NvcmUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gc3RyXG4gICAgLnJlcGxhY2UoU1RSSU5HX1VOREVSU0NPUkVfUkVHRVhQXzEsICckMV8kMicpXG4gICAgLnJlcGxhY2UoU1RSSU5HX1VOREVSU0NPUkVfUkVHRVhQXzIsICdfJylcbiAgICAudG9Mb3dlckNhc2UoKTtcbn1cblxuLyoqXG4gUmV0dXJucyB0aGUgQ2FwaXRhbGl6ZWQgZm9ybSBvZiBhIHN0cmluZ1xuXG4gYGBgamF2YXNjcmlwdFxuICdpbm5lckhUTUwnLmNhcGl0YWxpemUoKSAgICAgICAgIC8vICdJbm5lckhUTUwnXG4gJ2FjdGlvbl9uYW1lJy5jYXBpdGFsaXplKCkgICAgICAgLy8gJ0FjdGlvbl9uYW1lJ1xuICdjc3MtY2xhc3MtbmFtZScuY2FwaXRhbGl6ZSgpICAgIC8vICdDc3MtY2xhc3MtbmFtZSdcbiAnbXkgZmF2b3JpdGUgaXRlbXMnLmNhcGl0YWxpemUoKSAvLyAnTXkgZmF2b3JpdGUgaXRlbXMnXG4gYGBgXG5cbiBAbWV0aG9kIGNhcGl0YWxpemVcbiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdG8gY2FwaXRhbGl6ZS5cbiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBjYXBpdGFsaXplZCBzdHJpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYXBpdGFsaXplKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHN0ci5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0ci5zbGljZSgxKTtcbn1cblxuLyoqXG4gKiBDYWxjdWxhdGUgdGhlIGxldmVuc2h0ZWluIGRpc3RhbmNlIG9mIHR3byBzdHJpbmdzLlxuICogU2VlIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0xldmVuc2h0ZWluX2Rpc3RhbmNlLlxuICogQmFzZWQgb2ZmIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2FuZHJlaS1tLzk4MjkyNyAoZm9yIHVzaW5nIHRoZSBmYXN0ZXIgZHluYW1pYyBwcm9ncmFtbWluZ1xuICogdmVyc2lvbikuXG4gKlxuICogQHBhcmFtIGEgU3RyaW5nIGEuXG4gKiBAcGFyYW0gYiBTdHJpbmcgYi5cbiAqIEByZXR1cm5zIEEgbnVtYmVyIHRoYXQgcmVwcmVzZW50cyB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgdHdvIHN0cmluZ3MuIFRoZSBncmVhdGVyIHRoZSBudW1iZXJcbiAqICAgdGhlIG1vcmUgZGlzdGFudCB0aGUgc3RyaW5ncyBhcmUgZnJvbSBlYWNoIG90aGVycy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxldmVuc2h0ZWluKGE6IHN0cmluZywgYjogc3RyaW5nKTogbnVtYmVyIHtcbiAgaWYgKGEubGVuZ3RoID09IDApIHtcbiAgICByZXR1cm4gYi5sZW5ndGg7XG4gIH1cbiAgaWYgKGIubGVuZ3RoID09IDApIHtcbiAgICByZXR1cm4gYS5sZW5ndGg7XG4gIH1cblxuICBjb25zdCBtYXRyaXg6IG51bWJlcltdW10gPSBbXTtcblxuICAvLyBpbmNyZW1lbnQgYWxvbmcgdGhlIGZpcnN0IGNvbHVtbiBvZiBlYWNoIHJvd1xuICBmb3IgKGxldCBpID0gMDsgaSA8PSBiLmxlbmd0aDsgaSsrKSB7XG4gICAgbWF0cml4W2ldID0gW2ldO1xuICB9XG5cbiAgLy8gaW5jcmVtZW50IGVhY2ggY29sdW1uIGluIHRoZSBmaXJzdCByb3dcbiAgZm9yIChsZXQgaiA9IDA7IGogPD0gYS5sZW5ndGg7IGorKykge1xuICAgIG1hdHJpeFswXVtqXSA9IGo7XG4gIH1cblxuICAvLyBGaWxsIGluIHRoZSByZXN0IG9mIHRoZSBtYXRyaXhcbiAgZm9yIChsZXQgaSA9IDE7IGkgPD0gYi5sZW5ndGg7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAxOyBqIDw9IGEubGVuZ3RoOyBqKyspIHtcbiAgICAgIGlmIChiLmNoYXJBdChpIC0gMSkgPT0gYS5jaGFyQXQoaiAtIDEpKSB7XG4gICAgICAgIG1hdHJpeFtpXVtqXSA9IG1hdHJpeFtpIC0gMV1baiAtIDFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWF0cml4W2ldW2pdID0gTWF0aC5taW4oXG4gICAgICAgICAgbWF0cml4W2kgLSAxXVtqIC0gMV0gKyAxLCAvLyBzdWJzdGl0dXRpb25cbiAgICAgICAgICBtYXRyaXhbaV1baiAtIDFdICsgMSwgLy8gaW5zZXJ0aW9uXG4gICAgICAgICAgbWF0cml4W2kgLSAxXVtqXSArIDEsIC8vIGRlbGV0aW9uXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG1hdHJpeFtiLmxlbmd0aF1bYS5sZW5ndGhdO1xufVxuIl19