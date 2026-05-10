"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimNewlines = exports.stripIndents = exports.stripIndent = exports.indentBy = exports.oneLine = void 0;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function oneLine(strings, ...values) {
    const endResult = String.raw(strings, ...values);
    return endResult.replace(/(?:\r?\n(?:\s*))+/gm, ' ').trim();
}
exports.oneLine = oneLine;
function indentBy(indentations) {
    let i = '';
    while (indentations--) {
        i += ' ';
    }
    return (strings, ...values) => {
        return i + stripIndent(strings, ...values).replace(/\n/g, '\n' + i);
    };
}
exports.indentBy = indentBy;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripIndent(strings, ...values) {
    const endResult = String.raw(strings, ...values);
    // remove the shortest leading indentation from each line
    const match = endResult.match(/^[ \t]*(?=\S)/gm);
    // return early if there's nothing to strip
    if (match === null) {
        return endResult;
    }
    const indent = Math.min(...match.map((el) => el.length));
    const regexp = new RegExp('^[ \\t]{' + indent + '}', 'gm');
    return (indent > 0 ? endResult.replace(regexp, '') : endResult).trim();
}
exports.stripIndent = stripIndent;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripIndents(strings, ...values) {
    return String.raw(strings, ...values)
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
        .trim();
}
exports.stripIndents = stripIndents;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function trimNewlines(strings, ...values) {
    const endResult = String.raw(strings, ...values);
    return (endResult
        // Remove the newline at the start.
        .replace(/^(?:\r?\n)+/, '')
        // Remove the newline at the end and following whitespace.
        .replace(/(?:\r?\n(?:\s*))$/, ''));
}
exports.trimNewlines = trimNewlines;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGl0ZXJhbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9jb3JlL3NyYy91dGlscy9saXRlcmFscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFRSCw4REFBOEQ7QUFDOUQsU0FBZ0IsT0FBTyxDQUFDLE9BQTZCLEVBQUUsR0FBRyxNQUFhO0lBQ3JFLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUM7SUFFakQsT0FBTyxTQUFTLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQzlELENBQUM7QUFKRCwwQkFJQztBQUVELFNBQWdCLFFBQVEsQ0FBQyxZQUFvQjtJQUMzQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDWCxPQUFPLFlBQVksRUFBRSxFQUFFO1FBQ3JCLENBQUMsSUFBSSxHQUFHLENBQUM7S0FDVjtJQUVELE9BQU8sQ0FBQyxPQUFPLEVBQUUsR0FBRyxNQUFNLEVBQUUsRUFBRTtRQUM1QixPQUFPLENBQUMsR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDdEUsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVRELDRCQVNDO0FBRUQsOERBQThEO0FBQzlELFNBQWdCLFdBQVcsQ0FBQyxPQUE2QixFQUFFLEdBQUcsTUFBYTtJQUN6RSxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDO0lBRWpELHlEQUF5RDtJQUN6RCxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFFakQsMkNBQTJDO0lBQzNDLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtRQUNsQixPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUN6RCxNQUFNLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxVQUFVLEdBQUcsTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUUzRCxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3pFLENBQUM7QUFmRCxrQ0FlQztBQUVELDhEQUE4RDtBQUM5RCxTQUFnQixZQUFZLENBQUMsT0FBNkIsRUFBRSxHQUFHLE1BQWE7SUFDMUUsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLE1BQU0sQ0FBQztTQUNsQyxLQUFLLENBQUMsSUFBSSxDQUFDO1NBQ1gsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDMUIsSUFBSSxDQUFDLElBQUksQ0FBQztTQUNWLElBQUksRUFBRSxDQUFDO0FBQ1osQ0FBQztBQU5ELG9DQU1DO0FBRUQsOERBQThEO0FBQzlELFNBQWdCLFlBQVksQ0FBQyxPQUE2QixFQUFFLEdBQUcsTUFBYTtJQUMxRSxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDO0lBRWpELE9BQU8sQ0FDTCxTQUFTO1FBQ1AsbUNBQW1DO1NBQ2xDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDO1FBQzNCLDBEQUEwRDtTQUN6RCxPQUFPLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDLENBQ3BDLENBQUM7QUFDSixDQUFDO0FBVkQsb0NBVUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBUZW1wbGF0ZVRhZzxSID0gc3RyaW5nPiB7XG4gIC8vIEFueSBpcyB0aGUgb25seSB3YXkgaGVyZS5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgKHRlbXBsYXRlOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSwgLi4uc3Vic3RpdHV0aW9uczogYW55W10pOiBSO1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuZXhwb3J0IGZ1bmN0aW9uIG9uZUxpbmUoc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIC4uLnZhbHVlczogYW55W10pIHtcbiAgY29uc3QgZW5kUmVzdWx0ID0gU3RyaW5nLnJhdyhzdHJpbmdzLCAuLi52YWx1ZXMpO1xuXG4gIHJldHVybiBlbmRSZXN1bHQucmVwbGFjZSgvKD86XFxyP1xcbig/OlxccyopKSsvZ20sICcgJykudHJpbSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5kZW50QnkoaW5kZW50YXRpb25zOiBudW1iZXIpOiBUZW1wbGF0ZVRhZyB7XG4gIGxldCBpID0gJyc7XG4gIHdoaWxlIChpbmRlbnRhdGlvbnMtLSkge1xuICAgIGkgKz0gJyAnO1xuICB9XG5cbiAgcmV0dXJuIChzdHJpbmdzLCAuLi52YWx1ZXMpID0+IHtcbiAgICByZXR1cm4gaSArIHN0cmlwSW5kZW50KHN0cmluZ3MsIC4uLnZhbHVlcykucmVwbGFjZSgvXFxuL2csICdcXG4nICsgaSk7XG4gIH07XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG5leHBvcnQgZnVuY3Rpb24gc3RyaXBJbmRlbnQoc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIC4uLnZhbHVlczogYW55W10pIHtcbiAgY29uc3QgZW5kUmVzdWx0ID0gU3RyaW5nLnJhdyhzdHJpbmdzLCAuLi52YWx1ZXMpO1xuXG4gIC8vIHJlbW92ZSB0aGUgc2hvcnRlc3QgbGVhZGluZyBpbmRlbnRhdGlvbiBmcm9tIGVhY2ggbGluZVxuICBjb25zdCBtYXRjaCA9IGVuZFJlc3VsdC5tYXRjaCgvXlsgXFx0XSooPz1cXFMpL2dtKTtcblxuICAvLyByZXR1cm4gZWFybHkgaWYgdGhlcmUncyBub3RoaW5nIHRvIHN0cmlwXG4gIGlmIChtYXRjaCA9PT0gbnVsbCkge1xuICAgIHJldHVybiBlbmRSZXN1bHQ7XG4gIH1cblxuICBjb25zdCBpbmRlbnQgPSBNYXRoLm1pbiguLi5tYXRjaC5tYXAoKGVsKSA9PiBlbC5sZW5ndGgpKTtcbiAgY29uc3QgcmVnZXhwID0gbmV3IFJlZ0V4cCgnXlsgXFxcXHRdeycgKyBpbmRlbnQgKyAnfScsICdnbScpO1xuXG4gIHJldHVybiAoaW5kZW50ID4gMCA/IGVuZFJlc3VsdC5yZXBsYWNlKHJlZ2V4cCwgJycpIDogZW5kUmVzdWx0KS50cmltKCk7XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG5leHBvcnQgZnVuY3Rpb24gc3RyaXBJbmRlbnRzKHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5LCAuLi52YWx1ZXM6IGFueVtdKSB7XG4gIHJldHVybiBTdHJpbmcucmF3KHN0cmluZ3MsIC4uLnZhbHVlcylcbiAgICAuc3BsaXQoJ1xcbicpXG4gICAgLm1hcCgobGluZSkgPT4gbGluZS50cmltKCkpXG4gICAgLmpvaW4oJ1xcbicpXG4gICAgLnRyaW0oKTtcbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbmV4cG9ydCBmdW5jdGlvbiB0cmltTmV3bGluZXMoc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIC4uLnZhbHVlczogYW55W10pIHtcbiAgY29uc3QgZW5kUmVzdWx0ID0gU3RyaW5nLnJhdyhzdHJpbmdzLCAuLi52YWx1ZXMpO1xuXG4gIHJldHVybiAoXG4gICAgZW5kUmVzdWx0XG4gICAgICAvLyBSZW1vdmUgdGhlIG5ld2xpbmUgYXQgdGhlIHN0YXJ0LlxuICAgICAgLnJlcGxhY2UoL14oPzpcXHI/XFxuKSsvLCAnJylcbiAgICAgIC8vIFJlbW92ZSB0aGUgbmV3bGluZSBhdCB0aGUgZW5kIGFuZCBmb2xsb3dpbmcgd2hpdGVzcGFjZS5cbiAgICAgIC5yZXBsYWNlKC8oPzpcXHI/XFxuKD86XFxzKikpJC8sICcnKVxuICApO1xufVxuIl19