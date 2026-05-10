"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeToWorkflow = void 0;
const core_1 = require("@angular-devkit/core");
const color_1 = require("../../utilities/color");
function subscribeToWorkflow(workflow, logger) {
    const files = new Set();
    let error = false;
    let logs = [];
    const reporterSubscription = workflow.reporter.subscribe((event) => {
        // Strip leading slash to prevent confusion.
        const eventPath = event.path.charAt(0) === '/' ? event.path.substring(1) : event.path;
        switch (event.kind) {
            case 'error':
                error = true;
                const desc = event.description == 'alreadyExist' ? 'already exists' : 'does not exist';
                logger.error(`ERROR! ${eventPath} ${desc}.`);
                break;
            case 'update':
                logs.push(core_1.tags.oneLine `
              ${color_1.colors.cyan('UPDATE')} ${eventPath} (${event.content.length} bytes)
            `);
                files.add(eventPath);
                break;
            case 'create':
                logs.push(core_1.tags.oneLine `
              ${color_1.colors.green('CREATE')} ${eventPath} (${event.content.length} bytes)
            `);
                files.add(eventPath);
                break;
            case 'delete':
                logs.push(`${color_1.colors.yellow('DELETE')} ${eventPath}`);
                files.add(eventPath);
                break;
            case 'rename':
                const eventToPath = event.to.charAt(0) === '/' ? event.to.substring(1) : event.to;
                logs.push(`${color_1.colors.blue('RENAME')} ${eventPath} => ${eventToPath}`);
                files.add(eventPath);
                break;
        }
    });
    const lifecycleSubscription = workflow.lifeCycle.subscribe((event) => {
        if (event.kind == 'end' || event.kind == 'post-tasks-start') {
            if (!error) {
                // Output the logging queue, no error happened.
                logs.forEach((log) => logger.info(log));
            }
            logs = [];
            error = false;
        }
    });
    return {
        files,
        error,
        unsubscribe: () => {
            reporterSubscription.unsubscribe();
            lifecycleSubscription.unsubscribe();
        },
    };
}
exports.subscribeToWorkflow = subscribeToWorkflow;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hdGljLXdvcmtmbG93LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmQtYnVpbGRlci91dGlsaXRpZXMvc2NoZW1hdGljLXdvcmtmbG93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtDQUFxRDtBQUVyRCxpREFBK0M7QUFFL0MsU0FBZ0IsbUJBQW1CLENBQ2pDLFFBQXNCLEVBQ3RCLE1BQXlCO0lBTXpCLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7SUFDaEMsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ2xCLElBQUksSUFBSSxHQUFhLEVBQUUsQ0FBQztJQUV4QixNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDakUsNENBQTRDO1FBQzVDLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7UUFFdEYsUUFBUSxLQUFLLENBQUMsSUFBSSxFQUFFO1lBQ2xCLEtBQUssT0FBTztnQkFDVixLQUFLLEdBQUcsSUFBSSxDQUFDO2dCQUNiLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxXQUFXLElBQUksY0FBYyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUM7Z0JBQ3ZGLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxTQUFTLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztnQkFDN0MsTUFBTTtZQUNSLEtBQUssUUFBUTtnQkFDWCxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQUksQ0FBQyxPQUFPLENBQUE7Z0JBQ2QsY0FBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxTQUFTLEtBQUssS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNO2FBQzlELENBQUMsQ0FBQztnQkFDUCxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNyQixNQUFNO1lBQ1IsS0FBSyxRQUFRO2dCQUNYLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBSSxDQUFDLE9BQU8sQ0FBQTtnQkFDZCxjQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLFNBQVMsS0FBSyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU07YUFDL0QsQ0FBQyxDQUFDO2dCQUNQLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3JCLE1BQU07WUFDUixLQUFLLFFBQVE7Z0JBQ1gsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLGNBQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksU0FBUyxFQUFFLENBQUMsQ0FBQztnQkFDckQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDckIsTUFBTTtZQUNSLEtBQUssUUFBUTtnQkFDWCxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNsRixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsY0FBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxTQUFTLE9BQU8sV0FBVyxFQUFFLENBQUMsQ0FBQztnQkFDckUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDckIsTUFBTTtTQUNUO0lBQ0gsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLHFCQUFxQixHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDbkUsSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLGtCQUFrQixFQUFFO1lBQzNELElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ1YsK0NBQStDO2dCQUMvQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7YUFDekM7WUFFRCxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ1YsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUNmO0lBQ0gsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPO1FBQ0wsS0FBSztRQUNMLEtBQUs7UUFDTCxXQUFXLEVBQUUsR0FBRyxFQUFFO1lBQ2hCLG9CQUFvQixDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ25DLHFCQUFxQixDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3RDLENBQUM7S0FDRixDQUFDO0FBQ0osQ0FBQztBQWxFRCxrREFrRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgbG9nZ2luZywgdGFncyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IE5vZGVXb3JrZmxvdyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzL3Rvb2xzJztcbmltcG9ydCB7IGNvbG9ycyB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy9jb2xvcic7XG5cbmV4cG9ydCBmdW5jdGlvbiBzdWJzY3JpYmVUb1dvcmtmbG93KFxuICB3b3JrZmxvdzogTm9kZVdvcmtmbG93LFxuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuKToge1xuICBmaWxlczogU2V0PHN0cmluZz47XG4gIGVycm9yOiBib29sZWFuO1xuICB1bnN1YnNjcmliZTogKCkgPT4gdm9pZDtcbn0ge1xuICBjb25zdCBmaWxlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBsZXQgZXJyb3IgPSBmYWxzZTtcbiAgbGV0IGxvZ3M6IHN0cmluZ1tdID0gW107XG5cbiAgY29uc3QgcmVwb3J0ZXJTdWJzY3JpcHRpb24gPSB3b3JrZmxvdy5yZXBvcnRlci5zdWJzY3JpYmUoKGV2ZW50KSA9PiB7XG4gICAgLy8gU3RyaXAgbGVhZGluZyBzbGFzaCB0byBwcmV2ZW50IGNvbmZ1c2lvbi5cbiAgICBjb25zdCBldmVudFBhdGggPSBldmVudC5wYXRoLmNoYXJBdCgwKSA9PT0gJy8nID8gZXZlbnQucGF0aC5zdWJzdHJpbmcoMSkgOiBldmVudC5wYXRoO1xuXG4gICAgc3dpdGNoIChldmVudC5raW5kKSB7XG4gICAgICBjYXNlICdlcnJvcic6XG4gICAgICAgIGVycm9yID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgZGVzYyA9IGV2ZW50LmRlc2NyaXB0aW9uID09ICdhbHJlYWR5RXhpc3QnID8gJ2FscmVhZHkgZXhpc3RzJyA6ICdkb2VzIG5vdCBleGlzdCc7XG4gICAgICAgIGxvZ2dlci5lcnJvcihgRVJST1IhICR7ZXZlbnRQYXRofSAke2Rlc2N9LmApO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3VwZGF0ZSc6XG4gICAgICAgIGxvZ3MucHVzaCh0YWdzLm9uZUxpbmVgXG4gICAgICAgICAgICAgICR7Y29sb3JzLmN5YW4oJ1VQREFURScpfSAke2V2ZW50UGF0aH0gKCR7ZXZlbnQuY29udGVudC5sZW5ndGh9IGJ5dGVzKVxuICAgICAgICAgICAgYCk7XG4gICAgICAgIGZpbGVzLmFkZChldmVudFBhdGgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2NyZWF0ZSc6XG4gICAgICAgIGxvZ3MucHVzaCh0YWdzLm9uZUxpbmVgXG4gICAgICAgICAgICAgICR7Y29sb3JzLmdyZWVuKCdDUkVBVEUnKX0gJHtldmVudFBhdGh9ICgke2V2ZW50LmNvbnRlbnQubGVuZ3RofSBieXRlcylcbiAgICAgICAgICAgIGApO1xuICAgICAgICBmaWxlcy5hZGQoZXZlbnRQYXRoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdkZWxldGUnOlxuICAgICAgICBsb2dzLnB1c2goYCR7Y29sb3JzLnllbGxvdygnREVMRVRFJyl9ICR7ZXZlbnRQYXRofWApO1xuICAgICAgICBmaWxlcy5hZGQoZXZlbnRQYXRoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdyZW5hbWUnOlxuICAgICAgICBjb25zdCBldmVudFRvUGF0aCA9IGV2ZW50LnRvLmNoYXJBdCgwKSA9PT0gJy8nID8gZXZlbnQudG8uc3Vic3RyaW5nKDEpIDogZXZlbnQudG87XG4gICAgICAgIGxvZ3MucHVzaChgJHtjb2xvcnMuYmx1ZSgnUkVOQU1FJyl9ICR7ZXZlbnRQYXRofSA9PiAke2V2ZW50VG9QYXRofWApO1xuICAgICAgICBmaWxlcy5hZGQoZXZlbnRQYXRoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9KTtcblxuICBjb25zdCBsaWZlY3ljbGVTdWJzY3JpcHRpb24gPSB3b3JrZmxvdy5saWZlQ3ljbGUuc3Vic2NyaWJlKChldmVudCkgPT4ge1xuICAgIGlmIChldmVudC5raW5kID09ICdlbmQnIHx8IGV2ZW50LmtpbmQgPT0gJ3Bvc3QtdGFza3Mtc3RhcnQnKSB7XG4gICAgICBpZiAoIWVycm9yKSB7XG4gICAgICAgIC8vIE91dHB1dCB0aGUgbG9nZ2luZyBxdWV1ZSwgbm8gZXJyb3IgaGFwcGVuZWQuXG4gICAgICAgIGxvZ3MuZm9yRWFjaCgobG9nKSA9PiBsb2dnZXIuaW5mbyhsb2cpKTtcbiAgICAgIH1cblxuICAgICAgbG9ncyA9IFtdO1xuICAgICAgZXJyb3IgPSBmYWxzZTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgZmlsZXMsXG4gICAgZXJyb3IsXG4gICAgdW5zdWJzY3JpYmU6ICgpID0+IHtcbiAgICAgIHJlcG9ydGVyU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICBsaWZlY3ljbGVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9LFxuICB9O1xufVxuIl19