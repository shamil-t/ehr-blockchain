"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyTemplates = exports.template = exports.renameTemplateFiles = exports.pathTemplate = exports.applyPathTemplate = exports.contentTemplate = exports.applyContentTemplate = exports.InvalidPipeException = exports.UnknownPipeException = exports.OptionIsNotDefinedException = exports.TEMPLATE_FILENAME_RE = void 0;
const core_1 = require("@angular-devkit/core");
const util_1 = require("util");
const base_1 = require("./base");
exports.TEMPLATE_FILENAME_RE = /\.template$/;
class OptionIsNotDefinedException extends core_1.BaseException {
    constructor(name) {
        super(`Option "${name}" is not defined.`);
    }
}
exports.OptionIsNotDefinedException = OptionIsNotDefinedException;
class UnknownPipeException extends core_1.BaseException {
    constructor(name) {
        super(`Pipe "${name}" is not defined.`);
    }
}
exports.UnknownPipeException = UnknownPipeException;
class InvalidPipeException extends core_1.BaseException {
    constructor(name) {
        super(`Pipe "${name}" is invalid.`);
    }
}
exports.InvalidPipeException = InvalidPipeException;
const decoder = new util_1.TextDecoder('utf-8', { fatal: true });
function applyContentTemplate(options) {
    return (entry) => {
        const { path, content } = entry;
        try {
            const decodedContent = decoder.decode(content);
            return {
                path,
                content: Buffer.from((0, core_1.template)(decodedContent, {})(options)),
            };
        }
        catch (e) {
            if (e.code === 'ERR_ENCODING_INVALID_ENCODED_DATA') {
                return entry;
            }
            throw e;
        }
    };
}
exports.applyContentTemplate = applyContentTemplate;
function contentTemplate(options) {
    return (0, base_1.forEach)(applyContentTemplate(options));
}
exports.contentTemplate = contentTemplate;
function applyPathTemplate(data, options = {
    interpolationStart: '__',
    interpolationEnd: '__',
    pipeSeparator: '@',
}) {
    const is = options.interpolationStart;
    const ie = options.interpolationEnd;
    const isL = is.length;
    const ieL = ie.length;
    return (entry) => {
        let path = entry.path;
        const content = entry.content;
        const original = path;
        let start = path.indexOf(is);
        // + 1 to have at least a length 1 name. `____` is not valid.
        let end = path.indexOf(ie, start + isL + 1);
        while (start != -1 && end != -1) {
            const match = path.substring(start + isL, end);
            let replacement = data[match];
            if (!options.pipeSeparator) {
                if (typeof replacement == 'function') {
                    replacement = replacement.call(data, original);
                }
                if (replacement === undefined) {
                    throw new OptionIsNotDefinedException(match);
                }
            }
            else {
                const [name, ...pipes] = match.split(options.pipeSeparator);
                replacement = data[name];
                if (typeof replacement == 'function') {
                    replacement = replacement.call(data, original);
                }
                if (replacement === undefined) {
                    throw new OptionIsNotDefinedException(name);
                }
                replacement = pipes.reduce((acc, pipe) => {
                    if (!pipe) {
                        return acc;
                    }
                    if (!(pipe in data)) {
                        throw new UnknownPipeException(pipe);
                    }
                    if (typeof data[pipe] != 'function') {
                        throw new InvalidPipeException(pipe);
                    }
                    // Coerce to string.
                    return '' + data[pipe](acc);
                }, '' + replacement);
            }
            path = path.substring(0, start) + replacement + path.substring(end + ieL);
            start = path.indexOf(options.interpolationStart);
            // See above.
            end = path.indexOf(options.interpolationEnd, start + isL + 1);
        }
        return { path: (0, core_1.normalize)(path), content };
    };
}
exports.applyPathTemplate = applyPathTemplate;
function pathTemplate(options) {
    return (0, base_1.forEach)(applyPathTemplate(options));
}
exports.pathTemplate = pathTemplate;
/**
 * Remove every `.template` suffix from file names.
 */
function renameTemplateFiles() {
    return (0, base_1.forEach)((entry) => {
        if (entry.path.match(exports.TEMPLATE_FILENAME_RE)) {
            return {
                content: entry.content,
                path: (0, core_1.normalize)(entry.path.replace(exports.TEMPLATE_FILENAME_RE, '')),
            };
        }
        else {
            return entry;
        }
    });
}
exports.renameTemplateFiles = renameTemplateFiles;
function template(options) {
    return (0, base_1.chain)([
        contentTemplate(options),
        // Force cast to PathTemplateData. We need the type for the actual pathTemplate() call,
        // but in this case we cannot do anything as contentTemplate are more permissive.
        // Since values are coerced to strings in PathTemplates it will be fine in the end.
        pathTemplate(options),
    ]);
}
exports.template = template;
function applyTemplates(options) {
    return (0, base_1.forEach)((0, base_1.when)((path) => path.endsWith('.template'), (0, base_1.composeFileOperators)([
        applyContentTemplate(options),
        // See above for this weird cast.
        applyPathTemplate(options),
        (entry) => {
            return {
                content: entry.content,
                path: entry.path.replace(exports.TEMPLATE_FILENAME_RE, ''),
            };
        },
    ])));
}
exports.applyTemplates = applyTemplates;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy9ydWxlcy90ZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBMEY7QUFDMUYsK0JBQW1DO0FBR25DLGlDQUFvRTtBQUV2RCxRQUFBLG9CQUFvQixHQUFHLGFBQWEsQ0FBQztBQUVsRCxNQUFhLDJCQUE0QixTQUFRLG9CQUFhO0lBQzVELFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsV0FBVyxJQUFJLG1CQUFtQixDQUFDLENBQUM7SUFDNUMsQ0FBQztDQUNGO0FBSkQsa0VBSUM7QUFFRCxNQUFhLG9CQUFxQixTQUFRLG9CQUFhO0lBQ3JELFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsU0FBUyxJQUFJLG1CQUFtQixDQUFDLENBQUM7SUFDMUMsQ0FBQztDQUNGO0FBSkQsb0RBSUM7QUFFRCxNQUFhLG9CQUFxQixTQUFRLG9CQUFhO0lBQ3JELFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsU0FBUyxJQUFJLGVBQWUsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7Q0FDRjtBQUpELG9EQUlDO0FBa0JELE1BQU0sT0FBTyxHQUFHLElBQUksa0JBQVcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUUxRCxTQUFnQixvQkFBb0IsQ0FBSSxPQUFVO0lBQ2hELE9BQU8sQ0FBQyxLQUFnQixFQUFFLEVBQUU7UUFDMUIsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFaEMsSUFBSTtZQUNGLE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFL0MsT0FBTztnQkFDTCxJQUFJO2dCQUNKLE9BQU8sRUFBRSxNQUFN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bnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiwgbm9ybWFsaXplLCB0ZW1wbGF0ZSBhcyB0ZW1wbGF0ZUltcGwgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBUZXh0RGVjb2RlciB9IGZyb20gJ3V0aWwnO1xuaW1wb3J0IHsgRmlsZU9wZXJhdG9yLCBSdWxlIH0gZnJvbSAnLi4vZW5naW5lL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBGaWxlRW50cnkgfSBmcm9tICcuLi90cmVlL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBjaGFpbiwgY29tcG9zZUZpbGVPcGVyYXRvcnMsIGZvckVhY2gsIHdoZW4gfSBmcm9tICcuL2Jhc2UnO1xuXG5leHBvcnQgY29uc3QgVEVNUExBVEVfRklMRU5BTUVfUkUgPSAvXFwudGVtcGxhdGUkLztcblxuZXhwb3J0IGNsYXNzIE9wdGlvbklzTm90RGVmaW5lZEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgT3B0aW9uIFwiJHtuYW1lfVwiIGlzIG5vdCBkZWZpbmVkLmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBVbmtub3duUGlwZUV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgUGlwZSBcIiR7bmFtZX1cIiBpcyBub3QgZGVmaW5lZC5gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSW52YWxpZFBpcGVFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFBpcGUgXCIke25hbWV9XCIgaXMgaW52YWxpZC5gKTtcbiAgfVxufVxuXG5leHBvcnQgdHlwZSBQYXRoVGVtcGxhdGVWYWx1ZSA9IGJvb2xlYW4gfCBzdHJpbmcgfCBudW1iZXIgfCB1bmRlZmluZWQ7XG5leHBvcnQgdHlwZSBQYXRoVGVtcGxhdGVQaXBlRnVuY3Rpb24gPSAoeDogc3RyaW5nKSA9PiBQYXRoVGVtcGxhdGVWYWx1ZTtcbmV4cG9ydCB0eXBlIFBhdGhUZW1wbGF0ZURhdGEgPSB7XG4gIFtrZXk6IHN0cmluZ106IFBhdGhUZW1wbGF0ZVZhbHVlIHwgUGF0aFRlbXBsYXRlRGF0YSB8IFBhdGhUZW1wbGF0ZVBpcGVGdW5jdGlvbjtcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGF0aFRlbXBsYXRlT3B0aW9ucyB7XG4gIC8vIEludGVycG9sYXRpb24gc3RhcnQgYW5kIGVuZCBzdHJpbmdzLlxuICBpbnRlcnBvbGF0aW9uU3RhcnQ6IHN0cmluZztcbiAgLy8gSW50ZXJwb2xhdGlvbiBzdGFydCBhbmQgZW5kIHN0cmluZ3MuXG4gIGludGVycG9sYXRpb25FbmQ6IHN0cmluZztcblxuICAvLyBTZXBhcmF0b3IgZm9yIHBpcGVzLiBEbyBub3Qgc3BlY2lmeSB0byByZW1vdmUgcGlwZSBzdXBwb3J0LlxuICBwaXBlU2VwYXJhdG9yPzogc3RyaW5nO1xufVxuXG5jb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCd1dGYtOCcsIHsgZmF0YWw6IHRydWUgfSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseUNvbnRlbnRUZW1wbGF0ZTxUPihvcHRpb25zOiBUKTogRmlsZU9wZXJhdG9yIHtcbiAgcmV0dXJuIChlbnRyeTogRmlsZUVudHJ5KSA9PiB7XG4gICAgY29uc3QgeyBwYXRoLCBjb250ZW50IH0gPSBlbnRyeTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBkZWNvZGVkQ29udGVudCA9IGRlY29kZXIuZGVjb2RlKGNvbnRlbnQpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBwYXRoLFxuICAgICAgICBjb250ZW50OiBCdWZmZXIuZnJvbSh0ZW1wbGF0ZUltcGwoZGVjb2RlZENvbnRlbnQsIHt9KShvcHRpb25zKSksXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmICgoZSBhcyBOb2RlSlMuRXJybm9FeGNlcHRpb24pLmNvZGUgPT09ICdFUlJfRU5DT0RJTkdfSU5WQUxJRF9FTkNPREVEX0RBVEEnKSB7XG4gICAgICAgIHJldHVybiBlbnRyeTtcbiAgICAgIH1cblxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb250ZW50VGVtcGxhdGU8VD4ob3B0aW9uczogVCk6IFJ1bGUge1xuICByZXR1cm4gZm9yRWFjaChhcHBseUNvbnRlbnRUZW1wbGF0ZShvcHRpb25zKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVBhdGhUZW1wbGF0ZTxUIGV4dGVuZHMgUGF0aFRlbXBsYXRlRGF0YT4oXG4gIGRhdGE6IFQsXG4gIG9wdGlvbnM6IFBhdGhUZW1wbGF0ZU9wdGlvbnMgPSB7XG4gICAgaW50ZXJwb2xhdGlvblN0YXJ0OiAnX18nLFxuICAgIGludGVycG9sYXRpb25FbmQ6ICdfXycsXG4gICAgcGlwZVNlcGFyYXRvcjogJ0AnLFxuICB9LFxuKTogRmlsZU9wZXJhdG9yIHtcbiAgY29uc3QgaXMgPSBvcHRpb25zLmludGVycG9sYXRpb25TdGFydDtcbiAgY29uc3QgaWUgPSBvcHRpb25zLmludGVycG9sYXRpb25FbmQ7XG4gIGNvbnN0IGlzTCA9IGlzLmxlbmd0aDtcbiAgY29uc3QgaWVMID0gaWUubGVuZ3RoO1xuXG4gIHJldHVybiAoZW50cnk6IEZpbGVFbnRyeSkgPT4ge1xuICAgIGxldCBwYXRoID0gZW50cnkucGF0aCBhcyBzdHJpbmc7XG4gICAgY29uc3QgY29udGVudCA9IGVudHJ5LmNvbnRlbnQ7XG4gICAgY29uc3Qgb3JpZ2luYWwgPSBwYXRoO1xuXG4gICAgbGV0IHN0YXJ0ID0gcGF0aC5pbmRleE9mKGlzKTtcbiAgICAvLyArIDEgdG8gaGF2ZSBhdCBsZWFzdCBhIGxlbmd0aCAxIG5hbWUuIGBfX19fYCBpcyBub3QgdmFsaWQuXG4gICAgbGV0IGVuZCA9IHBhdGguaW5kZXhPZihpZSwgc3RhcnQgKyBpc0wgKyAxKTtcblxuICAgIHdoaWxlIChzdGFydCAhPSAtMSAmJiBlbmQgIT0gLTEpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gcGF0aC5zdWJzdHJpbmcoc3RhcnQgKyBpc0wsIGVuZCk7XG4gICAgICBsZXQgcmVwbGFjZW1lbnQgPSBkYXRhW21hdGNoXTtcblxuICAgICAgaWYgKCFvcHRpb25zLnBpcGVTZXBhcmF0b3IpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZXBsYWNlbWVudCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgcmVwbGFjZW1lbnQgPSByZXBsYWNlbWVudC5jYWxsKGRhdGEsIG9yaWdpbmFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXBsYWNlbWVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE9wdGlvbklzTm90RGVmaW5lZEV4Y2VwdGlvbihtYXRjaCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IFtuYW1lLCAuLi5waXBlc10gPSBtYXRjaC5zcGxpdChvcHRpb25zLnBpcGVTZXBhcmF0b3IpO1xuICAgICAgICByZXBsYWNlbWVudCA9IGRhdGFbbmFtZV07XG5cbiAgICAgICAgaWYgKHR5cGVvZiByZXBsYWNlbWVudCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgcmVwbGFjZW1lbnQgPSByZXBsYWNlbWVudC5jYWxsKGRhdGEsIG9yaWdpbmFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXBsYWNlbWVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE9wdGlvbklzTm90RGVmaW5lZEV4Y2VwdGlvbihuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcGxhY2VtZW50ID0gcGlwZXMucmVkdWNlKChhY2M6IHN0cmluZywgcGlwZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgaWYgKCFwaXBlKSB7XG4gICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIShwaXBlIGluIGRhdGEpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVW5rbm93blBpcGVFeGNlcHRpb24ocGlwZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0eXBlb2YgZGF0YVtwaXBlXSAhPSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgSW52YWxpZFBpcGVFeGNlcHRpb24ocGlwZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQ29lcmNlIHRvIHN0cmluZy5cbiAgICAgICAgICByZXR1cm4gJycgKyAoZGF0YVtwaXBlXSBhcyBQYXRoVGVtcGxhdGVQaXBlRnVuY3Rpb24pKGFjYyk7XG4gICAgICAgIH0sICcnICsgcmVwbGFjZW1lbnQpO1xuICAgICAgfVxuXG4gICAgICBwYXRoID0gcGF0aC5zdWJzdHJpbmcoMCwgc3RhcnQpICsgcmVwbGFjZW1lbnQgKyBwYXRoLnN1YnN0cmluZyhlbmQgKyBpZUwpO1xuXG4gICAgICBzdGFydCA9IHBhdGguaW5kZXhPZihvcHRpb25zLmludGVycG9sYXRpb25TdGFydCk7XG4gICAgICAvLyBTZWUgYWJvdmUuXG4gICAgICBlbmQgPSBwYXRoLmluZGV4T2Yob3B0aW9ucy5pbnRlcnBvbGF0aW9uRW5kLCBzdGFydCArIGlzTCArIDEpO1xuICAgIH1cblxuICAgIHJldHVybiB7IHBhdGg6IG5vcm1hbGl6ZShwYXRoKSwgY29udGVudCB9O1xuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGF0aFRlbXBsYXRlPFQgZXh0ZW5kcyBQYXRoVGVtcGxhdGVEYXRhPihvcHRpb25zOiBUKTogUnVsZSB7XG4gIHJldHVybiBmb3JFYWNoKGFwcGx5UGF0aFRlbXBsYXRlKG9wdGlvbnMpKTtcbn1cblxuLyoqXG4gKiBSZW1vdmUgZXZlcnkgYC50ZW1wbGF0ZWAgc3VmZml4IGZyb20gZmlsZSBuYW1lcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmFtZVRlbXBsYXRlRmlsZXMoKTogUnVsZSB7XG4gIHJldHVybiBmb3JFYWNoKChlbnRyeSkgPT4ge1xuICAgIGlmIChlbnRyeS5wYXRoLm1hdGNoKFRFTVBMQVRFX0ZJTEVOQU1FX1JFKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29udGVudDogZW50cnkuY29udGVudCxcbiAgICAgICAgcGF0aDogbm9ybWFsaXplKGVudHJ5LnBhdGgucmVwbGFjZShURU1QTEFURV9GSUxFTkFNRV9SRSwgJycpKSxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBlbnRyeTtcbiAgICB9XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGVtcGxhdGU8VCBleHRlbmRzIG9iamVjdD4ob3B0aW9uczogVCk6IFJ1bGUge1xuICByZXR1cm4gY2hhaW4oW1xuICAgIGNvbnRlbnRUZW1wbGF0ZShvcHRpb25zKSxcbiAgICAvLyBGb3JjZSBjYXN0IHRvIFBhdGhUZW1wbGF0ZURhdGEuIFdlIG5lZWQgdGhlIHR5cGUgZm9yIHRoZSBhY3R1YWwgcGF0aFRlbXBsYXRlKCkgY2FsbCxcbiAgICAvLyBidXQgaW4gdGhpcyBjYXNlIHdlIGNhbm5vdCBkbyBhbnl0aGluZyBhcyBjb250ZW50VGVtcGxhdGUgYXJlIG1vcmUgcGVybWlzc2l2ZS5cbiAgICAvLyBTaW5jZSB2YWx1ZXMgYXJlIGNvZXJjZWQgdG8gc3RyaW5ncyBpbiBQYXRoVGVtcGxhdGVzIGl0IHdpbGwgYmUgZmluZSBpbiB0aGUgZW5kLlxuICAgIHBhdGhUZW1wbGF0ZShvcHRpb25zIGFzIHt9IGFzIFBhdGhUZW1wbGF0ZURhdGEpLFxuICBdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5VGVtcGxhdGVzPFQgZXh0ZW5kcyBvYmplY3Q+KG9wdGlvbnM6IFQpOiBSdWxlIHtcbiAgcmV0dXJuIGZvckVhY2goXG4gICAgd2hlbihcbiAgICAgIChwYXRoKSA9PiBwYXRoLmVuZHNXaXRoKCcudGVtcGxhdGUnKSxcbiAgICAgIGNvbXBvc2VGaWxlT3BlcmF0b3JzKFtcbiAgICAgICAgYXBwbHlDb250ZW50VGVtcGxhdGUob3B0aW9ucyksXG4gICAgICAgIC8vIFNlZSBhYm92ZSBmb3IgdGhpcyB3ZWlyZCBjYXN0LlxuICAgICAgICBhcHBseVBhdGhUZW1wbGF0ZShvcHRpb25zIGFzIHt9IGFzIFBhdGhUZW1wbGF0ZURhdGEpLFxuICAgICAgICAoZW50cnkpID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29udGVudDogZW50cnkuY29udGVudCxcbiAgICAgICAgICAgIHBhdGg6IGVudHJ5LnBhdGgucmVwbGFjZShURU1QTEFURV9GSUxFTkFNRV9SRSwgJycpLFxuICAgICAgICAgIH0gYXMgRmlsZUVudHJ5O1xuICAgICAgICB9LFxuICAgICAgXSksXG4gICAgKSxcbiAgKTtcbn1cbiJdfQ==