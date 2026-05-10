"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTypeScriptDiagnostic = void 0;
const node_os_1 = require("node:os");
const typescript_1 = require("typescript");
/**
 * Converts TypeScript Diagnostic related information into an esbuild compatible note object.
 * Related information is a subset of a full TypeScript Diagnostic and also used for diagnostic
 * notes associated with the main Diagnostic.
 * @param info The TypeScript diagnostic relative information to convert.
 * @returns An esbuild diagnostic message as a PartialMessage object
 */
function convertTypeScriptDiagnosticInfo(info, textPrefix) {
    const newLine = (0, node_os_1.platform)() === 'win32' ? '\r\n' : '\n';
    let text = (0, typescript_1.flattenDiagnosticMessageText)(info.messageText, newLine);
    if (textPrefix) {
        text = textPrefix + text;
    }
    const note = { text };
    if (info.file) {
        note.location = {
            file: info.file.fileName,
            length: info.length,
        };
        // Calculate the line/column location and extract the full line text that has the diagnostic
        if (info.start) {
            const { line, character } = (0, typescript_1.getLineAndCharacterOfPosition)(info.file, info.start);
            note.location.line = line + 1;
            note.location.column = character;
            // The start position for the slice is the first character of the error line
            const lineStartPosition = (0, typescript_1.getPositionOfLineAndCharacter)(info.file, line, 0);
            // The end position for the slice is the first character of the next line or the length of
            // the entire file if the line is the last line of the file (getPositionOfLineAndCharacter
            // will error if a nonexistent line is passed).
            const { line: lastLineOfFile } = (0, typescript_1.getLineAndCharacterOfPosition)(info.file, info.file.text.length - 1);
            const lineEndPosition = line < lastLineOfFile
                ? (0, typescript_1.getPositionOfLineAndCharacter)(info.file, line + 1, 0)
                : info.file.text.length;
            note.location.lineText = info.file.text.slice(lineStartPosition, lineEndPosition).trimEnd();
        }
    }
    return note;
}
/**
 * Converts a TypeScript Diagnostic message into an esbuild compatible message object.
 * @param diagnostic The TypeScript diagnostic to convert.
 * @returns An esbuild diagnostic message as a PartialMessage object
 */
function convertTypeScriptDiagnostic(diagnostic) {
    let codePrefix = 'TS';
    let code = `${diagnostic.code}`;
    if (diagnostic.source === 'ngtsc') {
        codePrefix = 'NG';
        // Remove `-99` Angular prefix from diagnostic code
        code = code.slice(3);
    }
    const message = {
        ...convertTypeScriptDiagnosticInfo(diagnostic, `${codePrefix}${code}: `),
        // Store original diagnostic for reference if needed downstream
        detail: diagnostic,
    };
    if (diagnostic.relatedInformation?.length) {
        message.notes = diagnostic.relatedInformation.map((info) => convertTypeScriptDiagnosticInfo(info));
    }
    return message;
}
exports.convertTypeScriptDiagnostic = convertTypeScriptDiagnostic;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhZ25vc3RpY3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy90b29scy9lc2J1aWxkL2FuZ3VsYXIvZGlhZ25vc3RpY3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBR0gscUNBQW1DO0FBQ25DLDJDQU1vQjtBQUVwQjs7Ozs7O0dBTUc7QUFDSCxTQUFTLCtCQUErQixDQUN0QyxJQUFrQyxFQUNsQyxVQUFtQjtJQUVuQixNQUFNLE9BQU8sR0FBRyxJQUFBLGtCQUFRLEdBQUUsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3ZELElBQUksSUFBSSxHQUFHLElBQUEseUNBQTRCLEVBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNuRSxJQUFJLFVBQVUsRUFBRTtRQUNkLElBQUksR0FBRyxVQUFVLEdBQUcsSUFBSSxDQUFDO0tBQzFCO0lBRUQsTUFBTSxJQUFJLEdBQWdCLEVBQUUsSUFBSSxFQUFFLENBQUM7SUFFbkMsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO1FBQ2IsSUFBSSxDQUFDLFFBQVEsR0FBRztZQUNkLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVE7WUFDeEIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1NBQ3BCLENBQUM7UUFFRiw0RkFBNEY7UUFDNUYsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ2QsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxJQUFBLDBDQUE2QixFQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2pGLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUM7WUFDOUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDO1lBRWpDLDRFQUE0RTtZQUM1RSxNQUFNLGlCQUFpQixHQUFHLElBQUEsMENBQTZCLEVBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFNUUsMEZBQTBGO1lBQzFGLDBGQUEwRjtZQUMxRiwrQ0FBK0M7WUFDL0MsTUFBTSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsR0FBRyxJQUFBLDBDQUE2QixFQUM1RCxJQUFJLENBQUMsSUFBSSxFQUNULElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQzFCLENBQUM7WUFDRixNQUFNLGVBQWUsR0FDbkIsSUFBSSxHQUFHLGNBQWM7Z0JBQ25CLENBQUMsQ0FBQyxJQUFBLDBDQUE2QixFQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3ZELENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFFNUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLGVBQWUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzdGO0tBQ0Y7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBZ0IsMkJBQTJCLENBQUMsVUFBc0I7SUFDaEUsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDO0lBQ3RCLElBQUksSUFBSSxHQUFHLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2hDLElBQUksVUFBVSxDQUFDLE1BQU0sS0FBSyxPQUFPLEVBQUU7UUFDakMsVUFBVSxHQUFHLElBQUksQ0FBQztRQUNsQixtREFBbUQ7UUFDbkQsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDdEI7SUFFRCxNQUFNLE9BQU8sR0FBbUI7UUFDOUIsR0FBRywrQkFBK0IsQ0FBQyxVQUFVLEVBQUUsR0FBRyxVQUFVLEdBQUcsSUFBSSxJQUFJLENBQUM7UUFDeEUsK0RBQStEO1FBQy9ELE1BQU0sRUFBRSxVQUFVO0tBQ25CLENBQUM7SUFFRixJQUFJLFVBQVUsQ0FBQyxrQkFBa0IsRUFBRSxNQUFNLEVBQUU7UUFDekMsT0FBTyxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FDekQsK0JBQStCLENBQUMsSUFBSSxDQUFDLENBQ3RDLENBQUM7S0FDSDtJQUVELE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7QUF0QkQsa0VBc0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHsgUGFydGlhbE1lc3NhZ2UsIFBhcnRpYWxOb3RlIH0gZnJvbSAnZXNidWlsZCc7XG5pbXBvcnQgeyBwbGF0Zm9ybSB9IGZyb20gJ25vZGU6b3MnO1xuaW1wb3J0IHtcbiAgRGlhZ25vc3RpYyxcbiAgRGlhZ25vc3RpY1JlbGF0ZWRJbmZvcm1hdGlvbixcbiAgZmxhdHRlbkRpYWdub3N0aWNNZXNzYWdlVGV4dCxcbiAgZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24sXG4gIGdldFBvc2l0aW9uT2ZMaW5lQW5kQ2hhcmFjdGVyLFxufSBmcm9tICd0eXBlc2NyaXB0JztcblxuLyoqXG4gKiBDb252ZXJ0cyBUeXBlU2NyaXB0IERpYWdub3N0aWMgcmVsYXRlZCBpbmZvcm1hdGlvbiBpbnRvIGFuIGVzYnVpbGQgY29tcGF0aWJsZSBub3RlIG9iamVjdC5cbiAqIFJlbGF0ZWQgaW5mb3JtYXRpb24gaXMgYSBzdWJzZXQgb2YgYSBmdWxsIFR5cGVTY3JpcHQgRGlhZ25vc3RpYyBhbmQgYWxzbyB1c2VkIGZvciBkaWFnbm9zdGljXG4gKiBub3RlcyBhc3NvY2lhdGVkIHdpdGggdGhlIG1haW4gRGlhZ25vc3RpYy5cbiAqIEBwYXJhbSBpbmZvIFRoZSBUeXBlU2NyaXB0IGRpYWdub3N0aWMgcmVsYXRpdmUgaW5mb3JtYXRpb24gdG8gY29udmVydC5cbiAqIEByZXR1cm5zIEFuIGVzYnVpbGQgZGlhZ25vc3RpYyBtZXNzYWdlIGFzIGEgUGFydGlhbE1lc3NhZ2Ugb2JqZWN0XG4gKi9cbmZ1bmN0aW9uIGNvbnZlcnRUeXBlU2NyaXB0RGlhZ25vc3RpY0luZm8oXG4gIGluZm86IERpYWdub3N0aWNSZWxhdGVkSW5mb3JtYXRpb24sXG4gIHRleHRQcmVmaXg/OiBzdHJpbmcsXG4pOiBQYXJ0aWFsTm90ZSB7XG4gIGNvbnN0IG5ld0xpbmUgPSBwbGF0Zm9ybSgpID09PSAnd2luMzInID8gJ1xcclxcbicgOiAnXFxuJztcbiAgbGV0IHRleHQgPSBmbGF0dGVuRGlhZ25vc3RpY01lc3NhZ2VUZXh0KGluZm8ubWVzc2FnZVRleHQsIG5ld0xpbmUpO1xuICBpZiAodGV4dFByZWZpeCkge1xuICAgIHRleHQgPSB0ZXh0UHJlZml4ICsgdGV4dDtcbiAgfVxuXG4gIGNvbnN0IG5vdGU6IFBhcnRpYWxOb3RlID0geyB0ZXh0IH07XG5cbiAgaWYgKGluZm8uZmlsZSkge1xuICAgIG5vdGUubG9jYXRpb24gPSB7XG4gICAgICBmaWxlOiBpbmZvLmZpbGUuZmlsZU5hbWUsXG4gICAgICBsZW5ndGg6IGluZm8ubGVuZ3RoLFxuICAgIH07XG5cbiAgICAvLyBDYWxjdWxhdGUgdGhlIGxpbmUvY29sdW1uIGxvY2F0aW9uIGFuZCBleHRyYWN0IHRoZSBmdWxsIGxpbmUgdGV4dCB0aGF0IGhhcyB0aGUgZGlhZ25vc3RpY1xuICAgIGlmIChpbmZvLnN0YXJ0KSB7XG4gICAgICBjb25zdCB7IGxpbmUsIGNoYXJhY3RlciB9ID0gZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24oaW5mby5maWxlLCBpbmZvLnN0YXJ0KTtcbiAgICAgIG5vdGUubG9jYXRpb24ubGluZSA9IGxpbmUgKyAxO1xuICAgICAgbm90ZS5sb2NhdGlvbi5jb2x1bW4gPSBjaGFyYWN0ZXI7XG5cbiAgICAgIC8vIFRoZSBzdGFydCBwb3NpdGlvbiBmb3IgdGhlIHNsaWNlIGlzIHRoZSBmaXJzdCBjaGFyYWN0ZXIgb2YgdGhlIGVycm9yIGxpbmVcbiAgICAgIGNvbnN0IGxpbmVTdGFydFBvc2l0aW9uID0gZ2V0UG9zaXRpb25PZkxpbmVBbmRDaGFyYWN0ZXIoaW5mby5maWxlLCBsaW5lLCAwKTtcblxuICAgICAgLy8gVGhlIGVuZCBwb3NpdGlvbiBmb3IgdGhlIHNsaWNlIGlzIHRoZSBmaXJzdCBjaGFyYWN0ZXIgb2YgdGhlIG5leHQgbGluZSBvciB0aGUgbGVuZ3RoIG9mXG4gICAgICAvLyB0aGUgZW50aXJlIGZpbGUgaWYgdGhlIGxpbmUgaXMgdGhlIGxhc3QgbGluZSBvZiB0aGUgZmlsZSAoZ2V0UG9zaXRpb25PZkxpbmVBbmRDaGFyYWN0ZXJcbiAgICAgIC8vIHdpbGwgZXJyb3IgaWYgYSBub25leGlzdGVudCBsaW5lIGlzIHBhc3NlZCkuXG4gICAgICBjb25zdCB7IGxpbmU6IGxhc3RMaW5lT2ZGaWxlIH0gPSBnZXRMaW5lQW5kQ2hhcmFjdGVyT2ZQb3NpdGlvbihcbiAgICAgICAgaW5mby5maWxlLFxuICAgICAgICBpbmZvLmZpbGUudGV4dC5sZW5ndGggLSAxLFxuICAgICAgKTtcbiAgICAgIGNvbnN0IGxpbmVFbmRQb3NpdGlvbiA9XG4gICAgICAgIGxpbmUgPCBsYXN0TGluZU9mRmlsZVxuICAgICAgICAgID8gZ2V0UG9zaXRpb25PZkxpbmVBbmRDaGFyYWN0ZXIoaW5mby5maWxlLCBsaW5lICsgMSwgMClcbiAgICAgICAgICA6IGluZm8uZmlsZS50ZXh0Lmxlbmd0aDtcblxuICAgICAgbm90ZS5sb2NhdGlvbi5saW5lVGV4dCA9IGluZm8uZmlsZS50ZXh0LnNsaWNlKGxpbmVTdGFydFBvc2l0aW9uLCBsaW5lRW5kUG9zaXRpb24pLnRyaW1FbmQoKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbm90ZTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhIFR5cGVTY3JpcHQgRGlhZ25vc3RpYyBtZXNzYWdlIGludG8gYW4gZXNidWlsZCBjb21wYXRpYmxlIG1lc3NhZ2Ugb2JqZWN0LlxuICogQHBhcmFtIGRpYWdub3N0aWMgVGhlIFR5cGVTY3JpcHQgZGlhZ25vc3RpYyB0byBjb252ZXJ0LlxuICogQHJldHVybnMgQW4gZXNidWlsZCBkaWFnbm9zdGljIG1lc3NhZ2UgYXMgYSBQYXJ0aWFsTWVzc2FnZSBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRUeXBlU2NyaXB0RGlhZ25vc3RpYyhkaWFnbm9zdGljOiBEaWFnbm9zdGljKTogUGFydGlhbE1lc3NhZ2Uge1xuICBsZXQgY29kZVByZWZpeCA9ICdUUyc7XG4gIGxldCBjb2RlID0gYCR7ZGlhZ25vc3RpYy5jb2RlfWA7XG4gIGlmIChkaWFnbm9zdGljLnNvdXJjZSA9PT0gJ25ndHNjJykge1xuICAgIGNvZGVQcmVmaXggPSAnTkcnO1xuICAgIC8vIFJlbW92ZSBgLTk5YCBBbmd1bGFyIHByZWZpeCBmcm9tIGRpYWdub3N0aWMgY29kZVxuICAgIGNvZGUgPSBjb2RlLnNsaWNlKDMpO1xuICB9XG5cbiAgY29uc3QgbWVzc2FnZTogUGFydGlhbE1lc3NhZ2UgPSB7XG4gICAgLi4uY29udmVydFR5cGVTY3JpcHREaWFnbm9zdGljSW5mbyhkaWFnbm9zdGljLCBgJHtjb2RlUHJlZml4fSR7Y29kZX06IGApLFxuICAgIC8vIFN0b3JlIG9yaWdpbmFsIGRpYWdub3N0aWMgZm9yIHJlZmVyZW5jZSBpZiBuZWVkZWQgZG93bnN0cmVhbVxuICAgIGRldGFpbDogZGlhZ25vc3RpYyxcbiAgfTtcblxuICBpZiAoZGlhZ25vc3RpYy5yZWxhdGVkSW5mb3JtYXRpb24/Lmxlbmd0aCkge1xuICAgIG1lc3NhZ2Uubm90ZXMgPSBkaWFnbm9zdGljLnJlbGF0ZWRJbmZvcm1hdGlvbi5tYXAoKGluZm8pID0+XG4gICAgICBjb252ZXJ0VHlwZVNjcmlwdERpYWdub3N0aWNJbmZvKGluZm8pLFxuICAgICk7XG4gIH1cblxuICByZXR1cm4gbWVzc2FnZTtcbn1cbiJdfQ==