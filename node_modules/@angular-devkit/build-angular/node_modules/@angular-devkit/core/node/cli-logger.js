"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConsoleLogger = void 0;
const rxjs_1 = require("rxjs");
const src_1 = require("../src");
/**
 * A Logger that sends information to STDOUT and STDERR.
 */
function createConsoleLogger(verbose = false, stdout = process.stdout, stderr = process.stderr, colors) {
    const logger = new src_1.logging.IndentLogger('cling');
    logger.pipe((0, rxjs_1.filter)((entry) => entry.level !== 'debug' || verbose)).subscribe((entry) => {
        const color = colors && colors[entry.level];
        let output = stdout;
        switch (entry.level) {
            case 'warn':
            case 'fatal':
            case 'error':
                output = stderr;
                break;
        }
        // If we do console.log(message) or process.stdout.write(message + '\n'), the process might
        // stop before the whole message is written and the stream is flushed. This happens when
        // streams are asynchronous.
        //
        // NodeJS IO streams are different depending on platform and usage. In POSIX environment,
        // for example, they're asynchronous when writing to a pipe, but synchronous when writing
        // to a TTY. In windows, it's the other way around. You can verify which is which with
        // stream.isTTY and platform, but this is not good enough.
        // In the async case, one should wait for the callback before sending more data or
        // continuing the process. In our case it would be rather hard to do (but not impossible).
        //
        // Instead we take the easy way out and simply chunk the message and call the write
        // function while the buffer drain itself asynchronously. With a smaller chunk size than
        // the buffer, we are mostly certain that it works. In this case, the chunk has been picked
        // as half a page size (4096/2 = 2048), minus some bytes for the color formatting.
        // On POSIX it seems the buffer is 2 pages (8192), but just to be sure (could be different
        // by platform).
        //
        // For more details, see https://nodejs.org/api/process.html#process_a_note_on_process_i_o
        const chunkSize = 2000; // Small chunk.
        let message = entry.message;
        while (message) {
            const chunk = message.slice(0, chunkSize);
            message = message.slice(chunkSize);
            output.write(color ? color(chunk) : chunk);
        }
        output.write('\n');
    });
    return logger;
}
exports.createConsoleLogger = createConsoleLogger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLWxvZ2dlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvbm9kZS9jbGktbG9nZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtCQUE4QjtBQUM5QixnQ0FBaUM7QUFNakM7O0dBRUc7QUFDSCxTQUFnQixtQkFBbUIsQ0FDakMsT0FBTyxHQUFHLEtBQUssRUFDZixTQUF3QixPQUFPLENBQUMsTUFBTSxFQUN0QyxTQUF3QixPQUFPLENBQUMsTUFBTSxFQUN0QyxNQUFpRTtJQUVqRSxNQUFNLE1BQU0sR0FBRyxJQUFJLGFBQU8sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFakQsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFBLGFBQU0sRUFBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssS0FBSyxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUNyRixNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM1QyxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFFcEIsUUFBUSxLQUFLLENBQUMsS0FBSyxFQUFFO1lBQ25CLEtBQUssTUFBTSxDQUFDO1lBQ1osS0FBSyxPQUFPLENBQUM7WUFDYixLQUFLLE9BQU87Z0JBQ1YsTUFBTSxHQUFHLE1BQU0sQ0FBQztnQkFDaEIsTUFBTTtTQUNUO1FBRUQsMkZBQTJGO1FBQzNGLHdGQUF3RjtRQUN4Riw0QkFBNEI7UUFDNUIsRUFBRTtRQUNGLHlGQUF5RjtRQUN6Rix5RkFBeUY7UUFDekYsc0ZBQXNGO1FBQ3RGLDBEQUEwRDtRQUMxRCxrRkFBa0Y7UUFDbEYsMEZBQTBGO1FBQzFGLEVBQUU7UUFDRixtRkFBbUY7UUFDbkYsd0ZBQXdGO1FBQ3hGLDJGQUEyRjtRQUMzRixrRkFBa0Y7UUFDbEYsMEZBQTBGO1FBQzFGLGdCQUFnQjtRQUNoQixFQUFFO1FBQ0YsMEZBQTBGO1FBQzFGLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDLGVBQWU7UUFDdkMsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUM1QixPQUFPLE9BQU8sRUFBRTtZQUNkLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFDLE9BQU8sR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzVDO1FBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyQixDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFsREQsa0RBa0RDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGZpbHRlciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgbG9nZ2luZyB9IGZyb20gJy4uL3NyYyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvY2Vzc091dHB1dCB7XG4gIHdyaXRlKGJ1ZmZlcjogc3RyaW5nIHwgQnVmZmVyKTogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBBIExvZ2dlciB0aGF0IHNlbmRzIGluZm9ybWF0aW9uIHRvIFNURE9VVCBhbmQgU1RERVJSLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29uc29sZUxvZ2dlcihcbiAgdmVyYm9zZSA9IGZhbHNlLFxuICBzdGRvdXQ6IFByb2Nlc3NPdXRwdXQgPSBwcm9jZXNzLnN0ZG91dCxcbiAgc3RkZXJyOiBQcm9jZXNzT3V0cHV0ID0gcHJvY2Vzcy5zdGRlcnIsXG4gIGNvbG9ycz86IFBhcnRpYWw8UmVjb3JkPGxvZ2dpbmcuTG9nTGV2ZWwsIChzOiBzdHJpbmcpID0+IHN0cmluZz4+LFxuKTogbG9nZ2luZy5Mb2dnZXIge1xuICBjb25zdCBsb2dnZXIgPSBuZXcgbG9nZ2luZy5JbmRlbnRMb2dnZXIoJ2NsaW5nJyk7XG5cbiAgbG9nZ2VyLnBpcGUoZmlsdGVyKChlbnRyeSkgPT4gZW50cnkubGV2ZWwgIT09ICdkZWJ1ZycgfHwgdmVyYm9zZSkpLnN1YnNjcmliZSgoZW50cnkpID0+IHtcbiAgICBjb25zdCBjb2xvciA9IGNvbG9ycyAmJiBjb2xvcnNbZW50cnkubGV2ZWxdO1xuICAgIGxldCBvdXRwdXQgPSBzdGRvdXQ7XG5cbiAgICBzd2l0Y2ggKGVudHJ5LmxldmVsKSB7XG4gICAgICBjYXNlICd3YXJuJzpcbiAgICAgIGNhc2UgJ2ZhdGFsJzpcbiAgICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgICAgb3V0cHV0ID0gc3RkZXJyO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBkbyBjb25zb2xlLmxvZyhtZXNzYWdlKSBvciBwcm9jZXNzLnN0ZG91dC53cml0ZShtZXNzYWdlICsgJ1xcbicpLCB0aGUgcHJvY2VzcyBtaWdodFxuICAgIC8vIHN0b3AgYmVmb3JlIHRoZSB3aG9sZSBtZXNzYWdlIGlzIHdyaXR0ZW4gYW5kIHRoZSBzdHJlYW0gaXMgZmx1c2hlZC4gVGhpcyBoYXBwZW5zIHdoZW5cbiAgICAvLyBzdHJlYW1zIGFyZSBhc3luY2hyb25vdXMuXG4gICAgLy9cbiAgICAvLyBOb2RlSlMgSU8gc3RyZWFtcyBhcmUgZGlmZmVyZW50IGRlcGVuZGluZyBvbiBwbGF0Zm9ybSBhbmQgdXNhZ2UuIEluIFBPU0lYIGVudmlyb25tZW50LFxuICAgIC8vIGZvciBleGFtcGxlLCB0aGV5J3JlIGFzeW5jaHJvbm91cyB3aGVuIHdyaXRpbmcgdG8gYSBwaXBlLCBidXQgc3luY2hyb25vdXMgd2hlbiB3cml0aW5nXG4gICAgLy8gdG8gYSBUVFkuIEluIHdpbmRvd3MsIGl0J3MgdGhlIG90aGVyIHdheSBhcm91bmQuIFlvdSBjYW4gdmVyaWZ5IHdoaWNoIGlzIHdoaWNoIHdpdGhcbiAgICAvLyBzdHJlYW0uaXNUVFkgYW5kIHBsYXRmb3JtLCBidXQgdGhpcyBpcyBub3QgZ29vZCBlbm91Z2guXG4gICAgLy8gSW4gdGhlIGFzeW5jIGNhc2UsIG9uZSBzaG91bGQgd2FpdCBmb3IgdGhlIGNhbGxiYWNrIGJlZm9yZSBzZW5kaW5nIG1vcmUgZGF0YSBvclxuICAgIC8vIGNvbnRpbnVpbmcgdGhlIHByb2Nlc3MuIEluIG91ciBjYXNlIGl0IHdvdWxkIGJlIHJhdGhlciBoYXJkIHRvIGRvIChidXQgbm90IGltcG9zc2libGUpLlxuICAgIC8vXG4gICAgLy8gSW5zdGVhZCB3ZSB0YWtlIHRoZSBlYXN5IHdheSBvdXQgYW5kIHNpbXBseSBjaHVuayB0aGUgbWVzc2FnZSBhbmQgY2FsbCB0aGUgd3JpdGVcbiAgICAvLyBmdW5jdGlvbiB3aGlsZSB0aGUgYnVmZmVyIGRyYWluIGl0c2VsZiBhc3luY2hyb25vdXNseS4gV2l0aCBhIHNtYWxsZXIgY2h1bmsgc2l6ZSB0aGFuXG4gICAgLy8gdGhlIGJ1ZmZlciwgd2UgYXJlIG1vc3RseSBjZXJ0YWluIHRoYXQgaXQgd29ya3MuIEluIHRoaXMgY2FzZSwgdGhlIGNodW5rIGhhcyBiZWVuIHBpY2tlZFxuICAgIC8vIGFzIGhhbGYgYSBwYWdlIHNpemUgKDQwOTYvMiA9IDIwNDgpLCBtaW51cyBzb21lIGJ5dGVzIGZvciB0aGUgY29sb3IgZm9ybWF0dGluZy5cbiAgICAvLyBPbiBQT1NJWCBpdCBzZWVtcyB0aGUgYnVmZmVyIGlzIDIgcGFnZXMgKDgxOTIpLCBidXQganVzdCB0byBiZSBzdXJlIChjb3VsZCBiZSBkaWZmZXJlbnRcbiAgICAvLyBieSBwbGF0Zm9ybSkuXG4gICAgLy9cbiAgICAvLyBGb3IgbW9yZSBkZXRhaWxzLCBzZWUgaHR0cHM6Ly9ub2RlanMub3JnL2FwaS9wcm9jZXNzLmh0bWwjcHJvY2Vzc19hX25vdGVfb25fcHJvY2Vzc19pX29cbiAgICBjb25zdCBjaHVua1NpemUgPSAyMDAwOyAvLyBTbWFsbCBjaHVuay5cbiAgICBsZXQgbWVzc2FnZSA9IGVudHJ5Lm1lc3NhZ2U7XG4gICAgd2hpbGUgKG1lc3NhZ2UpIHtcbiAgICAgIGNvbnN0IGNodW5rID0gbWVzc2FnZS5zbGljZSgwLCBjaHVua1NpemUpO1xuICAgICAgbWVzc2FnZSA9IG1lc3NhZ2Uuc2xpY2UoY2h1bmtTaXplKTtcbiAgICAgIG91dHB1dC53cml0ZShjb2xvciA/IGNvbG9yKGNodW5rKSA6IGNodW5rKTtcbiAgICB9XG4gICAgb3V0cHV0LndyaXRlKCdcXG4nKTtcbiAgfSk7XG5cbiAgcmV0dXJuIGxvZ2dlcjtcbn1cbiJdfQ==