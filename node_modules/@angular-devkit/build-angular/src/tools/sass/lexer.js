"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.findImports = exports.findUrls = void 0;
// TODO: Combine everything into a single pass lexer
/**
 * Determines if a unicode code point is a CSS whitespace character.
 * @param code The unicode code point to test.
 * @returns true, if the code point is CSS whitespace; false, otherwise.
 */
function isWhitespace(code) {
    // Based on https://www.w3.org/TR/css-syntax-3/#whitespace
    switch (code) {
        case 0x0009: // tab
        case 0x0020: // space
        case 0x000a: // line feed
        case 0x000c: // form feed
        case 0x000d: // carriage return
            return true;
        default:
            return false;
    }
}
/**
 * Scans a CSS or Sass file and locates all valid url function values as defined by the
 * syntax specification.
 * @param contents A string containing a CSS or Sass file to scan.
 * @returns An iterable that yields each CSS url function value found.
 */
function* findUrls(contents) {
    let pos = 0;
    let width = 1;
    let current = -1;
    const next = () => {
        pos += width;
        current = contents.codePointAt(pos) ?? -1;
        width = current > 0xffff ? 2 : 1;
        return current;
    };
    // Based on https://www.w3.org/TR/css-syntax-3/#consume-ident-like-token
    while ((pos = contents.indexOf('url(', pos)) !== -1) {
        // Set to position of the (
        pos += 3;
        width = 1;
        // Consume all leading whitespace
        while (isWhitespace(next())) {
            /* empty */
        }
        // Initialize URL state
        const url = { start: pos, end: -1, value: '' };
        let complete = false;
        // If " or ', then consume the value as a string
        if (current === 0x0022 || current === 0x0027) {
            const ending = current;
            // Based on https://www.w3.org/TR/css-syntax-3/#consume-string-token
            while (!complete) {
                switch (next()) {
                    case -1: // EOF
                        return;
                    case 0x000a: // line feed
                    case 0x000c: // form feed
                    case 0x000d: // carriage return
                        // Invalid
                        complete = true;
                        break;
                    case 0x005c: // \ -- character escape
                        // If not EOF or newline, add the character after the escape
                        switch (next()) {
                            case -1:
                                return;
                            case 0x000a: // line feed
                            case 0x000c: // form feed
                            case 0x000d: // carriage return
                                // Skip when inside a string
                                break;
                            default:
                                // TODO: Handle hex escape codes
                                url.value += String.fromCodePoint(current);
                                break;
                        }
                        break;
                    case ending:
                        // Full string position should include the quotes for replacement
                        url.end = pos + 1;
                        complete = true;
                        yield url;
                        break;
                    default:
                        url.value += String.fromCodePoint(current);
                        break;
                }
            }
            next();
            continue;
        }
        // Based on https://www.w3.org/TR/css-syntax-3/#consume-url-token
        while (!complete) {
            switch (current) {
                case -1: // EOF
                    return;
                case 0x0022: // "
                case 0x0027: // '
                case 0x0028: // (
                    // Invalid
                    complete = true;
                    break;
                case 0x0029: // )
                    // URL is valid and complete
                    url.end = pos;
                    complete = true;
                    break;
                case 0x005c: // \ -- character escape
                    // If not EOF or newline, add the character after the escape
                    switch (next()) {
                        case -1: // EOF
                            return;
                        case 0x000a: // line feed
                        case 0x000c: // form feed
                        case 0x000d: // carriage return
                            // Invalid
                            complete = true;
                            break;
                        default:
                            // TODO: Handle hex escape codes
                            url.value += String.fromCodePoint(current);
                            break;
                    }
                    break;
                default:
                    if (isWhitespace(current)) {
                        while (isWhitespace(next())) {
                            /* empty */
                        }
                        // Unescaped whitespace is only valid before the closing )
                        if (current === 0x0029) {
                            // URL is valid
                            url.end = pos;
                        }
                        complete = true;
                    }
                    else {
                        // Add the character to the url value
                        url.value += String.fromCodePoint(current);
                    }
                    break;
            }
            next();
        }
        // An end position indicates a URL was found
        if (url.end !== -1) {
            yield url;
        }
    }
}
exports.findUrls = findUrls;
/**
 * Scans a CSS or Sass file and locates all valid import/use directive values as defined by the
 * syntax specification.
 * @param contents A string containing a CSS or Sass file to scan.
 * @returns An iterable that yields each CSS directive value found.
 */
function* findImports(contents) {
    yield* find(contents, '@import ');
    yield* find(contents, '@use ');
}
exports.findImports = findImports;
/**
 * Scans a CSS or Sass file and locates all valid function/directive values as defined by the
 * syntax specification.
 * @param contents A string containing a CSS or Sass file to scan.
 * @param prefix The prefix to start a valid segment.
 * @returns An iterable that yields each CSS url function value found.
 */
function* find(contents, prefix) {
    let pos = 0;
    let width = 1;
    let current = -1;
    const next = () => {
        pos += width;
        current = contents.codePointAt(pos) ?? -1;
        width = current > 0xffff ? 2 : 1;
        return current;
    };
    // Based on https://www.w3.org/TR/css-syntax-3/#consume-ident-like-token
    while ((pos = contents.indexOf(prefix, pos)) !== -1) {
        // Set to position of the last character in prefix
        pos += prefix.length - 1;
        width = 1;
        // Consume all leading whitespace
        while (isWhitespace(next())) {
            /* empty */
        }
        // Initialize URL state
        const url = { start: pos, end: -1, specifier: '' };
        let complete = false;
        // If " or ', then consume the value as a string
        if (current === 0x0022 || current === 0x0027) {
            const ending = current;
            // Based on https://www.w3.org/TR/css-syntax-3/#consume-string-token
            while (!complete) {
                switch (next()) {
                    case -1: // EOF
                        return;
                    case 0x000a: // line feed
                    case 0x000c: // form feed
                    case 0x000d: // carriage return
                        // Invalid
                        complete = true;
                        break;
                    case 0x005c: // \ -- character escape
                        // If not EOF or newline, add the character after the escape
                        switch (next()) {
                            case -1:
                                return;
                            case 0x000a: // line feed
                            case 0x000c: // form feed
                            case 0x000d: // carriage return
                                // Skip when inside a string
                                break;
                            default:
                                // TODO: Handle hex escape codes
                                url.specifier += String.fromCodePoint(current);
                                break;
                        }
                        break;
                    case ending:
                        // Full string position should include the quotes for replacement
                        url.end = pos + 1;
                        complete = true;
                        yield url;
                        break;
                    default:
                        url.specifier += String.fromCodePoint(current);
                        break;
                }
            }
            next();
            continue;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy90b29scy9zYXNzL2xleGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILG9EQUFvRDtBQUVwRDs7OztHQUlHO0FBQ0gsU0FBUyxZQUFZLENBQUMsSUFBWTtJQUNoQywwREFBMEQ7SUFDMUQsUUFBUSxJQUFJLEVBQUU7UUFDWixLQUFLLE1BQU0sQ0FBQyxDQUFDLE1BQU07UUFDbkIsS0FBSyxNQUFNLENBQUMsQ0FBQyxRQUFRO1FBQ3JCLEtBQUssTUFBTSxDQUFDLENBQUMsWUFBWTtRQUN6QixLQUFLLE1BQU0sQ0FBQyxDQUFDLFlBQVk7UUFDekIsS0FBSyxNQUFNLEVBQUUsa0JBQWtCO1lBQzdCLE9BQU8sSUFBSSxDQUFDO1FBQ2Q7WUFDRSxPQUFPLEtBQUssQ0FBQztLQUNoQjtBQUNILENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILFFBQWUsQ0FBQyxDQUFDLFFBQVEsQ0FDdkIsUUFBZ0I7SUFFaEIsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDO0lBQ1osSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDakIsTUFBTSxJQUFJLEdBQUcsR0FBRyxFQUFFO1FBQ2hCLEdBQUcsSUFBSSxLQUFLLENBQUM7UUFDYixPQUFPLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMxQyxLQUFLLEdBQUcsT0FBTyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFakMsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQyxDQUFDO0lBRUYsd0VBQXdFO0lBQ3hFLE9BQU8sQ0FBQyxH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RSxFQUFFO29CQUNkLEtBQUssQ0FBQyxDQUFDLEVBQUUsTUFBTTt3QkFDYixPQUFPO29CQUNULEtBQUssTUFBTSxDQUFDLENBQUMsWUFBWTtvQkFDekIsS0FBSyxNQUFNLENBQUMsQ0FBQyxZQUFZO29CQUN6QixLQUFLLE1BQU0sRUFBRSxrQkFBa0I7d0JBQzdCLFVBQVU7d0JBQ1YsUUFBUSxHQUFHLElBQUksQ0FBQzt3QkFDaEIsTUFBTTtvQkFDUixLQUFLLE1BQU0sRUFBRSx3QkFBd0I7d0JBQ25DLDREQUE0RDt3QkFDNUQsUUFBUSxJQUFJLEVBQUUsRUFBRTs0QkFDZCxLQUFLLENBQUMsQ0FBQztnQ0FDTCxPQUFPOzRCQUNULEtBQUssTUFBTSxDQUFDLENBQUMsWUFBWTs0QkFDekIsS0FBSyxNQUFNLENBQUMsQ0FBQyxZQUFZOzRCQUN6QixLQUFLLE1BQU0sRUFBRSxrQkFBa0I7Z0NBQzdCLDRCQUE0QjtnQ0FDNUIsTUFBTTs0QkFDUjtnQ0FDRSxnQ0FBZ0M7Z0NBQ2hDLEdBQUcsQ0FBQyxTQUFTLElBQUksTUFBTSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQ0FDL0MsTUFBTTt5QkFDVDt3QkFDRCxNQUFNO29CQUNSLEtBQUssTUFBTTt3QkFDVCxpRUFBaUU7d0JBQ2pFLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQzt3QkFDbEIsUUFBUSxHQUFHLElBQUksQ0FBQzt3QkFDaEIsTUFBTSxHQUFHLENBQUM7d0JBQ1YsTUFBTTtvQkFDUjt3QkFDRSxHQUFHLENBQUMsU0FBUyxJQUFJLE1BQU0sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQy9DLE1BQU07aUJBQ1Q7YUFDRjtZQUVELElBQUksRUFBRSxDQUFDO1lBQ1AsU0FBUztTQUNWO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFRPRE86IENvbWJpbmUgZXZlcnl0aGluZyBpbnRvIGEgc2luZ2xlIHBhc3MgbGV4ZXJcblxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIGEgdW5pY29kZSBjb2RlIHBvaW50IGlzIGEgQ1NTIHdoaXRlc3BhY2UgY2hhcmFjdGVyLlxuICogQHBhcmFtIGNvZGUgVGhlIHVuaWNvZGUgY29kZSBwb2ludCB0byB0ZXN0LlxuICogQHJldHVybnMgdHJ1ZSwgaWYgdGhlIGNvZGUgcG9pbnQgaXMgQ1NTIHdoaXRlc3BhY2U7IGZhbHNlLCBvdGhlcndpc2UuXG4gKi9cbmZ1bmN0aW9uIGlzV2hpdGVzcGFjZShjb2RlOiBudW1iZXIpOiBib29sZWFuIHtcbiAgLy8gQmFzZWQgb24gaHR0cHM6Ly93d3cudzMub3JnL1RSL2Nzcy1zeW50YXgtMy8jd2hpdGVzcGFjZVxuICBzd2l0Y2ggKGNvZGUpIHtcbiAgICBjYXNlIDB4MDAwOTogLy8gdGFiXG4gICAgY2FzZSAweDAwMjA6IC8vIHNwYWNlXG4gICAgY2FzZSAweDAwMGE6IC8vIGxpbmUgZmVlZFxuICAgIGNhc2UgMHgwMDBjOiAvLyBmb3JtIGZlZWRcbiAgICBjYXNlIDB4MDAwZDogLy8gY2FycmlhZ2UgcmV0dXJuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogU2NhbnMgYSBDU1Mgb3IgU2FzcyBmaWxlIGFuZCBsb2NhdGVzIGFsbCB2YWxpZCB1cmwgZnVuY3Rpb24gdmFsdWVzIGFzIGRlZmluZWQgYnkgdGhlXG4gKiBzeW50YXggc3BlY2lmaWNhdGlvbi5cbiAqIEBwYXJhbSBjb250ZW50cyBBIHN0cmluZyBjb250YWluaW5nIGEgQ1NTIG9yIFNhc3MgZmlsZSB0byBzY2FuLlxuICogQHJldHVybnMgQW4gaXRlcmFibGUgdGhhdCB5aWVsZHMgZWFjaCBDU1MgdXJsIGZ1bmN0aW9uIHZhbHVlIGZvdW5kLlxuICovXG5leHBvcnQgZnVuY3Rpb24qIGZpbmRVcmxzKFxuICBjb250ZW50czogc3RyaW5nLFxuKTogSXRlcmFibGU8eyBzdGFydDogbnVtYmVyOyBlbmQ6IG51bWJlcjsgdmFsdWU6IHN0cmluZyB9PiB7XG4gIGxldCBwb3MgPSAwO1xuICBsZXQgd2lkdGggPSAxO1xuICBsZXQgY3VycmVudCA9IC0xO1xuICBjb25zdCBuZXh0ID0gKCkgPT4ge1xuICAgIHBvcyArPSB3aWR0aDtcbiAgICBjdXJyZW50ID0gY29udGVudHMuY29kZVBvaW50QXQocG9zKSA/PyAtMTtcbiAgICB3aWR0aCA9IGN1cnJlbnQgPiAweGZmZmYgPyAyIDogMTtcblxuICAgIHJldHVybiBjdXJyZW50O1xuICB9O1xuXG4gIC8vIEJhc2VkIG9uIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9jc3Mtc3ludGF4LTMvI2NvbnN1bWUtaWRlbnQtbGlrZS10b2tlblxuICB3aGlsZSAoKHBvcyA9IGNvbnRlbnRzLmluZGV4T2YoJ3VybCgnLCBwb3MpKSAhPT0gLTEpIHtcbiAgICAvLyBTZXQgdG8gcG9zaXRpb24gb2YgdGhlIChcbiAgICBwb3MgKz0gMztcbiAgICB3aWR0aCA9IDE7XG5cbiAgICAvLyBDb25zdW1lIGFsbCBsZWFkaW5nIHdoaXRlc3BhY2VcbiAgICB3aGlsZSAoaXNXaGl0ZXNwYWNlKG5leHQoKSkpIHtcbiAgICAgIC8qIGVtcHR5ICovXG4gICAgfVxuXG4gICAgLy8gSW5pdGlhbGl6ZSBVUkwgc3RhdGVcbiAgICBjb25zdCB1cmwgPSB7IHN0YXJ0OiBwb3MsIGVuZDogLTEsIHZhbHVlOiAnJyB9O1xuICAgIGxldCBjb21wbGV0ZSA9IGZhbHNlO1xuXG4gICAgLy8gSWYgXCIgb3IgJywgdGhlbiBjb25zdW1lIHRoZSB2YWx1ZSBhcyBhIHN0cmluZ1xuICAgIGlmIChjdXJyZW50ID09PSAweDAwMjIgfHwgY3VycmVudCA9PT0gMHgwMDI3KSB7XG4gICAgICBjb25zdCBlbmRpbmcgPSBjdXJyZW50O1xuICAgICAgLy8gQmFzZWQgb24gaHR0cHM6Ly93d3cudzMub3JnL1RSL2Nzcy1zeW50YXgtMy8jY29uc3VtZS1zdHJpbmctdG9rZW5cbiAgICAgIHdoaWxlICghY29tcGxldGUpIHtcbiAgICAgICAgc3dpdGNoIChuZXh0KCkpIHtcbiAgICAgICAgICBjYXNlIC0xOiAvLyBFT0ZcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICBjYXNlIDB4MDAwYTogLy8gbGluZSBmZWVkXG4gICAgICAgICAgY2FzZSAweDAwMGM6IC8vIGZvcm0gZmVlZFxuICAgICAgICAgIGNhc2UgMHgwMDBkOiAvLyBjYXJyaWFnZSByZXR1cm5cbiAgICAgICAgICAgIC8vIEludmFsaWRcbiAgICAgICAgICAgIGNvbXBsZXRlID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMHgwMDVjOiAvLyBcXCAtLSBjaGFyYWN0ZXIgZXNjYXBlXG4gICAgICAgICAgICAvLyBJZiBub3QgRU9GIG9yIG5ld2xpbmUsIGFkZCB0aGUgY2hhcmFjdGVyIGFmdGVyIHRoZSBlc2NhcGVcbiAgICAgICAgICAgIHN3aXRjaCAobmV4dCgpKSB7XG4gICAgICAgICAgICAgIGNhc2UgLTE6XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICBjYXNlIDB4MDAwYTogLy8gbGluZSBmZWVkXG4gICAgICAgICAgICAgIGNhc2UgMHgwMDBjOiAvLyBmb3JtIGZlZWRcbiAgICAgICAgICAgICAgY2FzZSAweDAwMGQ6IC8vIGNhcnJpYWdlIHJldHVyblxuICAgICAgICAgICAgICAgIC8vIFNraXAgd2hlbiBpbnNpZGUgYSBzdHJpbmdcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBIYW5kbGUgaGV4IGVzY2FwZSBjb2Rlc1xuICAgICAgICAgICAgICAgIHVybC52YWx1ZSArPSBTdHJpbmcuZnJvbUNvZGVQb2ludChjdXJyZW50KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgZW5kaW5nOlxuICAgICAgICAgICAgLy8gRnVsbCBzdHJpbmcgcG9zaXRpb24gc2hvdWxkIGluY2x1ZGUgdGhlIHF1b3RlcyBmb3IgcmVwbGFjZW1lbnRcbiAgICAgICAgICAgIHVybC5lbmQgPSBwb3MgKyAxO1xuICAgICAgICAgICAgY29tcGxldGUgPSB0cnVlO1xuICAgICAgICAgICAgeWllbGQgdXJsO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHVybC52YWx1ZSArPSBTdHJpbmcuZnJvbUNvZGVQb2ludChjdXJyZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIG5leHQoKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIEJhc2VkIG9uIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9jc3Mtc3ludGF4LTMvI2NvbnN1bWUtdXJsLXRva2VuXG4gICAgd2hpbGUgKCFjb21wbGV0ZSkge1xuICAgICAgc3dpdGNoIChjdXJyZW50KSB7XG4gICAgICAgIGNhc2UgLTE6IC8vIEVPRlxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY2FzZSAweDAwMjI6IC8vIFwiXG4gICAgICAgIGNhc2UgMHgwMDI3OiAvLyAnXG4gICAgICAgIGNhc2UgMHgwMDI4OiAvLyAoXG4gICAgICAgICAgLy8gSW52YWxpZFxuICAgICAgICAgIGNvbXBsZXRlID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAweDAwMjk6IC8vIClcbiAgICAgICAgICAvLyBVUkwgaXMgdmFsaWQgYW5kIGNvbXBsZXRlXG4gICAgICAgICAgdXJsLmVuZCA9IHBvcztcbiAgICAgICAgICBjb21wbGV0ZSA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMHgwMDVjOiAvLyBcXCAtLSBjaGFyYWN0ZXIgZXNjYXBlXG4gICAgICAgICAgLy8gSWYgbm90IEVPRiBvciBuZXdsaW5lLCBhZGQgdGhlIGNoYXJhY3RlciBhZnRlciB0aGUgZXNjYXBlXG4gICAgICAgICAgc3dpdGNoIChuZXh0KCkpIHtcbiAgICAgICAgICAgIGNhc2UgLTE6IC8vIEVPRlxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBjYXNlIDB4MDAwYTogLy8gbGluZSBmZWVkXG4gICAgICAgICAgICBjYXNlIDB4MDAwYzogLy8gZm9ybSBmZWVkXG4gICAgICAgICAgICBjYXNlIDB4MDAwZDogLy8gY2FycmlhZ2UgcmV0dXJuXG4gICAgICAgICAgICAgIC8vIEludmFsaWRcbiAgICAgICAgICAgICAgY29tcGxldGUgPSB0cnVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIC8vIFRPRE86IEhhbmRsZSBoZXggZXNjYXBlIGNvZGVzXG4gICAgICAgICAgICAgIHVybC52YWx1ZSArPSBTdHJpbmcuZnJvbUNvZGVQb2ludChjdXJyZW50KTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmIChpc1doaXRlc3BhY2UoY3VycmVudCkpIHtcbiAgICAgICAgICAgIHdoaWxlIChpc1doaXRlc3BhY2UobmV4dCgpKSkge1xuICAgICAgICAgICAgICAvKiBlbXB0eSAqL1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVW5lc2NhcGVkIHdoaXRlc3BhY2UgaXMgb25seSB2YWxpZCBiZWZvcmUgdGhlIGNsb3NpbmcgKVxuICAgICAgICAgICAgaWYgKGN1cnJlbnQgPT09IDB4MDAyOSkge1xuICAgICAgICAgICAgICAvLyBVUkwgaXMgdmFsaWRcbiAgICAgICAgICAgICAgdXJsLmVuZCA9IHBvcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbXBsZXRlID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gQWRkIHRoZSBjaGFyYWN0ZXIgdG8gdGhlIHVybCB2YWx1ZVxuICAgICAgICAgICAgdXJsLnZhbHVlICs9IFN0cmluZy5mcm9tQ29kZVBvaW50KGN1cnJlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvLyBBbiBlbmQgcG9zaXRpb24gaW5kaWNhdGVzIGEgVVJMIHdhcyBmb3VuZFxuICAgIGlmICh1cmwuZW5kICE9PSAtMSkge1xuICAgICAgeWllbGQgdXJsO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNjYW5zIGEgQ1NTIG9yIFNhc3MgZmlsZSBhbmQgbG9jYXRlcyBhbGwgdmFsaWQgaW1wb3J0L3VzZSBkaXJlY3RpdmUgdmFsdWVzIGFzIGRlZmluZWQgYnkgdGhlXG4gKiBzeW50YXggc3BlY2lmaWNhdGlvbi5cbiAqIEBwYXJhbSBjb250ZW50cyBBIHN0cmluZyBjb250YWluaW5nIGEgQ1NTIG9yIFNhc3MgZmlsZSB0byBzY2FuLlxuICogQHJldHVybnMgQW4gaXRlcmFibGUgdGhhdCB5aWVsZHMgZWFjaCBDU1MgZGlyZWN0aXZlIHZhbHVlIGZvdW5kLlxuICovXG5leHBvcnQgZnVuY3Rpb24qIGZpbmRJbXBvcnRzKFxuICBjb250ZW50czogc3RyaW5nLFxuKTogSXRlcmFibGU8eyBzdGFydDogbnVtYmVyOyBlbmQ6IG51bWJlcjsgc3BlY2lmaWVyOiBzdHJpbmcgfT4ge1xuICB5aWVsZCogZmluZChjb250ZW50cywgJ0BpbXBvcnQgJyk7XG4gIHlpZWxkKiBmaW5kKGNvbnRlbnRzLCAnQHVzZSAnKTtcbn1cblxuLyoqXG4gKiBTY2FucyBhIENTUyBvciBTYXNzIGZpbGUgYW5kIGxvY2F0ZXMgYWxsIHZhbGlkIGZ1bmN0aW9uL2RpcmVjdGl2ZSB2YWx1ZXMgYXMgZGVmaW5lZCBieSB0aGVcbiAqIHN5bnRheCBzcGVjaWZpY2F0aW9uLlxuICogQHBhcmFtIGNvbnRlbnRzIEEgc3RyaW5nIGNvbnRhaW5pbmcgYSBDU1Mgb3IgU2FzcyBmaWxlIHRvIHNjYW4uXG4gKiBAcGFyYW0gcHJlZml4IFRoZSBwcmVmaXggdG8gc3RhcnQgYSB2YWxpZCBzZWdtZW50LlxuICogQHJldHVybnMgQW4gaXRlcmFibGUgdGhhdCB5aWVsZHMgZWFjaCBDU1MgdXJsIGZ1bmN0aW9uIHZhbHVlIGZvdW5kLlxuICovXG5mdW5jdGlvbiogZmluZChcbiAgY29udGVudHM6IHN0cmluZyxcbiAgcHJlZml4OiBzdHJpbmcsXG4pOiBJdGVyYWJsZTx7IHN0YXJ0OiBudW1iZXI7IGVuZDogbnVtYmVyOyBzcGVjaWZpZXI6IHN0cmluZyB9PiB7XG4gIGxldCBwb3MgPSAwO1xuICBsZXQgd2lkdGggPSAxO1xuICBsZXQgY3VycmVudCA9IC0xO1xuICBjb25zdCBuZXh0ID0gKCkgPT4ge1xuICAgIHBvcyArPSB3aWR0aDtcbiAgICBjdXJyZW50ID0gY29udGVudHMuY29kZVBvaW50QXQocG9zKSA/PyAtMTtcbiAgICB3aWR0aCA9IGN1cnJlbnQgPiAweGZmZmYgPyAyIDogMTtcblxuICAgIHJldHVybiBjdXJyZW50O1xuICB9O1xuXG4gIC8vIEJhc2VkIG9uIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9jc3Mtc3ludGF4LTMvI2NvbnN1bWUtaWRlbnQtbGlrZS10b2tlblxuICB3aGlsZSAoKHBvcyA9IGNvbnRlbnRzLmluZGV4T2YocHJlZml4LCBwb3MpKSAhPT0gLTEpIHtcbiAgICAvLyBTZXQgdG8gcG9zaXRpb24gb2YgdGhlIGxhc3QgY2hhcmFjdGVyIGluIHByZWZpeFxuICAgIHBvcyArPSBwcmVmaXgubGVuZ3RoIC0gMTtcbiAgICB3aWR0aCA9IDE7XG5cbiAgICAvLyBDb25zdW1lIGFsbCBsZWFkaW5nIHdoaXRlc3BhY2VcbiAgICB3aGlsZSAoaXNXaGl0ZXNwYWNlKG5leHQoKSkpIHtcbiAgICAgIC8qIGVtcHR5ICovXG4gICAgfVxuXG4gICAgLy8gSW5pdGlhbGl6ZSBVUkwgc3RhdGVcbiAgICBjb25zdCB1cmwgPSB7IHN0YXJ0OiBwb3MsIGVuZDogLTEsIHNwZWNpZmllcjogJycgfTtcbiAgICBsZXQgY29tcGxldGUgPSBmYWxzZTtcblxuICAgIC8vIElmIFwiIG9yICcsIHRoZW4gY29uc3VtZSB0aGUgdmFsdWUgYXMgYSBzdHJpbmdcbiAgICBpZiAoY3VycmVudCA9PT0gMHgwMDIyIHx8IGN1cnJlbnQgPT09IDB4MDAyNykge1xuICAgICAgY29uc3QgZW5kaW5nID0gY3VycmVudDtcbiAgICAgIC8vIEJhc2VkIG9uIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9jc3Mtc3ludGF4LTMvI2NvbnN1bWUtc3RyaW5nLXRva2VuXG4gICAgICB3aGlsZSAoIWNvbXBsZXRlKSB7XG4gICAgICAgIHN3aXRjaCAobmV4dCgpKSB7XG4gICAgICAgICAgY2FzZSAtMTogLy8gRU9GXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgY2FzZSAweDAwMGE6IC8vIGxpbmUgZmVlZFxuICAgICAgICAgIGNhc2UgMHgwMDBjOiAvLyBmb3JtIGZlZWRcbiAgICAgICAgICBjYXNlIDB4MDAwZDogLy8gY2FycmlhZ2UgcmV0dXJuXG4gICAgICAgICAgICAvLyBJbnZhbGlkXG4gICAgICAgICAgICBjb21wbGV0ZSA9IHRydWU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDB4MDA1YzogLy8gXFwgLS0gY2hhcmFjdGVyIGVzY2FwZVxuICAgICAgICAgICAgLy8gSWYgbm90IEVPRiBvciBuZXdsaW5lLCBhZGQgdGhlIGNoYXJhY3RlciBhZnRlciB0aGUgZXNjYXBlXG4gICAgICAgICAgICBzd2l0Y2ggKG5leHQoKSkge1xuICAgICAgICAgICAgICBjYXNlIC0xOlxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgY2FzZSAweDAwMGE6IC8vIGxpbmUgZmVlZFxuICAgICAgICAgICAgICBjYXNlIDB4MDAwYzogLy8gZm9ybSBmZWVkXG4gICAgICAgICAgICAgIGNhc2UgMHgwMDBkOiAvLyBjYXJyaWFnZSByZXR1cm5cbiAgICAgICAgICAgICAgICAvLyBTa2lwIHdoZW4gaW5zaWRlIGEgc3RyaW5nXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogSGFuZGxlIGhleCBlc2NhcGUgY29kZXNcbiAgICAgICAgICAgICAgICB1cmwuc3BlY2lmaWVyICs9IFN0cmluZy5mcm9tQ29kZVBvaW50KGN1cnJlbnQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBlbmRpbmc6XG4gICAgICAgICAgICAvLyBGdWxsIHN0cmluZyBwb3NpdGlvbiBzaG91bGQgaW5jbHVkZSB0aGUgcXVvdGVzIGZvciByZXBsYWNlbWVudFxuICAgICAgICAgICAgdXJsLmVuZCA9IHBvcyArIDE7XG4gICAgICAgICAgICBjb21wbGV0ZSA9IHRydWU7XG4gICAgICAgICAgICB5aWVsZCB1cmw7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdXJsLnNwZWNpZmllciArPSBTdHJpbmcuZnJvbUNvZGVQb2ludChjdXJyZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIG5leHQoKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgfVxufVxuIl19