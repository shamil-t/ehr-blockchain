"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AliasHost = void 0;
const path_1 = require("../path");
const resolver_1 = require("./resolver");
/**
 * A Virtual Host that allow to alias some paths to other paths.
 *
 * This does not verify, when setting an alias, that the target or source exist. Neither does it
 * check whether it's a file or a directory. Please not that directories are also renamed/replaced.
 *
 * No recursion is done on the resolution, which means the following is perfectly valid then:
 *
 * ```
 *     host.aliases.set(normalize('/file/a'), normalize('/file/b'));
 *     host.aliases.set(normalize('/file/b'), normalize('/file/a'));
 * ```
 *
 * This will result in a proper swap of two files for each others.
 *
 * @example
 *   const host = new SimpleMemoryHost();
 *   host.write(normalize('/some/file'), content).subscribe();
 *
 *   const aHost = new AliasHost(host);
 *   aHost.read(normalize('/some/file'))
 *     .subscribe(x => expect(x).toBe(content));
 *   aHost.aliases.set(normalize('/some/file'), normalize('/other/path');
 *
 *   // This file will not exist because /other/path does not exist.
 *   aHost.read(normalize('/some/file'))
 *     .subscribe(undefined, err => expect(err.message).toMatch(/does not exist/));
 *
 * @example
 *   const host = new SimpleMemoryHost();
 *   host.write(normalize('/some/folder/file'), content).subscribe();
 *
 *   const aHost = new AliasHost(host);
 *   aHost.read(normalize('/some/folder/file'))
 *     .subscribe(x => expect(x).toBe(content));
 *   aHost.aliases.set(normalize('/some'), normalize('/other');
 *
 *   // This file will not exist because /other/path does not exist.
 *   aHost.read(normalize('/some/folder/file'))
 *     .subscribe(undefined, err => expect(err.message).toMatch(/does not exist/));
 *
 *   // Create the file with new content and verify that this has the new content.
 *   aHost.write(normalize('/other/folder/file'), content2).subscribe();
 *   aHost.read(normalize('/some/folder/file'))
 *     .subscribe(x => expect(x).toBe(content2));
 */
class AliasHost extends resolver_1.ResolverHost {
    constructor() {
        super(...arguments);
        this._aliases = new Map();
    }
    _resolve(path) {
        let maybeAlias = this._aliases.get(path);
        const sp = (0, path_1.split)(path);
        const remaining = [];
        // Also resolve all parents of the requested files, only picking the first one that matches.
        // This can have surprising behaviour when aliases are inside another alias. It will always
        // use the closest one to the file.
        while (!maybeAlias && sp.length > 0) {
            const p = (0, path_1.join)(path_1.NormalizedRoot, ...sp);
            maybeAlias = this._aliases.get(p);
            if (maybeAlias) {
                maybeAlias = (0, path_1.join)(maybeAlias, ...remaining);
            }
            // Allow non-null-operator because we know sp.length > 0 (condition on while).
            remaining.unshift(sp.pop()); // eslint-disable-line @typescript-eslint/no-non-null-assertion
        }
        return maybeAlias || path;
    }
    get aliases() {
        return this._aliases;
    }
}
exports.AliasHost = AliasHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9jb3JlL3NyYy92aXJ0dWFsLWZzL2hvc3QvYWxpYXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsa0NBQTBFO0FBQzFFLHlDQUEwQztBQUUxQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBNkNHO0FBQ0gsTUFBYSxTQUFzQyxTQUFRLHVCQUFvQjtJQUEvRTs7UUFDWSxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQWMsQ0FBQztJQTJCN0MsQ0FBQztJQXpCVyxRQUFRLENBQUMsSUFBVTtRQUMzQixJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QyxNQUFNLEVBQUUsR0FBRyxJQUFBLFlBQUssRUFBQyxJQUFJLENBQUMsQ0FBQztRQUN2QixNQUFNLFNBQVMsR0FBbUIsRUFBRSxDQUFDO1FBRXJDLDRGQUE0RjtRQUM1RiwyRkFBMkY7UUFDM0YsbUNBQW1DO1FBQ25DLE9BQU8sQ0FBQyxVQUFVLElBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDbkMsTUFBTSxDQUFDLEdBQUcsSUFBQSxXQUFJLEVBQUMscUJBQWMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ3RDLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVsQyxJQUFJLFVBQVUsRUFBRTtnQkFDZCxVQUFVLEdBQUcsSUFBQSxXQUFJLEVBQUMsVUFBVSxFQUFFLEdBQUcsU0FBUyxDQUFDLENBQUM7YUFDN0M7WUFDRCw4RUFBOEU7WUFDOUUsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFHLENBQUMsQ0FBQyxDQUFDLCtEQUErRDtTQUM5RjtRQUVELE9BQU8sVUFBVSxJQUFJLElBQUksQ0FBQztJQUM1QixDQUFDO0lBRUQsSUFBSSxPQUFPO1FBQ1QsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO0lBQ3ZCLENBQUM7Q0FDRjtBQTVCRCw4QkE0QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgTm9ybWFsaXplZFJvb3QsIFBhdGgsIFBhdGhGcmFnbWVudCwgam9pbiwgc3BsaXQgfSBmcm9tICcuLi9wYXRoJztcbmltcG9ydCB7IFJlc29sdmVySG9zdCB9IGZyb20gJy4vcmVzb2x2ZXInO1xuXG4vKipcbiAqIEEgVmlydHVhbCBIb3N0IHRoYXQgYWxsb3cgdG8gYWxpYXMgc29tZSBwYXRocyB0byBvdGhlciBwYXRocy5cbiAqXG4gKiBUaGlzIGRvZXMgbm90IHZlcmlmeSwgd2hlbiBzZXR0aW5nIGFuIGFsaWFzLCB0aGF0IHRoZSB0YXJnZXQgb3Igc291cmNlIGV4aXN0LiBOZWl0aGVyIGRvZXMgaXRcbiAqIGNoZWNrIHdoZXRoZXIgaXQncyBhIGZpbGUgb3IgYSBkaXJlY3RvcnkuIFBsZWFzZSBub3QgdGhhdCBkaXJlY3RvcmllcyBhcmUgYWxzbyByZW5hbWVkL3JlcGxhY2VkLlxuICpcbiAqIE5vIHJlY3Vyc2lvbiBpcyBkb25lIG9uIHRoZSByZXNvbHV0aW9uLCB3aGljaCBtZWFucyB0aGUgZm9sbG93aW5nIGlzIHBlcmZlY3RseSB2YWxpZCB0aGVuOlxuICpcbiAqIGBgYFxuICogICAgIGhvc3QuYWxpYXNlcy5zZXQobm9ybWFsaXplKCcvZmlsZS9hJyksIG5vcm1hbGl6ZSgnL2ZpbGUvYicpKTtcbiAqICAgICBob3N0LmFsaWFzZXMuc2V0KG5vcm1hbGl6ZSgnL2ZpbGUvYicpLCBub3JtYWxpemUoJy9maWxlL2EnKSk7XG4gKiBgYGBcbiAqXG4gKiBUaGlzIHdpbGwgcmVzdWx0IGluIGEgcHJvcGVyIHN3YXAgb2YgdHdvIGZpbGVzIGZvciBlYWNoIG90aGVycy5cbiAqXG4gKiBAZXhhbXBsZVxuICogICBjb25zdCBob3N0ID0gbmV3IFNpbXBsZU1lbW9yeUhvc3QoKTtcbiAqICAgaG9zdC53cml0ZShub3JtYWxpemUoJy9zb21lL2ZpbGUnKSwgY29udGVudCkuc3Vic2NyaWJlKCk7XG4gKlxuICogICBjb25zdCBhSG9zdCA9IG5ldyBBbGlhc0hvc3QoaG9zdCk7XG4gKiAgIGFIb3N0LnJlYWQobm9ybWFsaXplKCcvc29tZS9maWxlJykpXG4gKiAgICAgLnN1YnNjcmliZSh4ID0+IGV4cGVjdCh4KS50b0JlKGNvbnRlbnQpKTtcbiAqICAgYUhvc3QuYWxpYXNlcy5zZXQobm9ybWFsaXplKCcvc29tZS9maWxlJyksIG5vcm1hbGl6ZSgnL290aGVyL3BhdGgnKTtcbiAqXG4gKiAgIC8vIFRoaXMgZmlsZSB3aWxsIG5vdCBleGlzdCBiZWNhdXNlIC9vdGhlci9wYXRoIGRvZXMgbm90IGV4aXN0LlxuICogICBhSG9zdC5yZWFkKG5vcm1hbGl6ZSgnL3NvbWUvZmlsZScpKVxuICogICAgIC5zdWJzY3JpYmUodW5kZWZpbmVkLCBlcnIgPT4gZXhwZWN0KGVyci5tZXNzYWdlKS50b01hdGNoKC9kb2VzIG5vdCBleGlzdC8pKTtcbiAqXG4gKiBAZXhhbXBsZVxuICogICBjb25zdCBob3N0ID0gbmV3IFNpbXBsZU1lbW9yeUhvc3QoKTtcbiAqICAgaG9zdC53cml0ZShub3JtYWxpemUoJy9zb21lL2ZvbGRlci9maWxlJyksIGNvbnRlbnQpLnN1YnNjcmliZSgpO1xuICpcbiAqICAgY29uc3QgYUhvc3QgPSBuZXcgQWxpYXNIb3N0KGhvc3QpO1xuICogICBhSG9zdC5yZWFkKG5vcm1hbGl6ZSgnL3NvbWUvZm9sZGVyL2ZpbGUnKSlcbiAqICAgICAuc3Vic2NyaWJlKHggPT4gZXhwZWN0KHgpLnRvQmUoY29udGVudCkpO1xuICogICBhSG9zdC5hbGlhc2VzLnNldChub3JtYWxpemUoJy9zb21lJyksIG5vcm1hbGl6ZSgnL290aGVyJyk7XG4gKlxuICogICAvLyBUaGlzIGZpbGUgd2lsbCBub3QgZXhpc3QgYmVjYXVzZSAvb3RoZXIvcGF0aCBkb2VzIG5vdCBleGlzdC5cbiAqICAgYUhvc3QucmVhZChub3JtYWxpemUoJy9zb21lL2ZvbGRlci9maWxlJykpXG4gKiAgICAgLnN1YnNjcmliZSh1bmRlZmluZWQsIGVyciA9PiBleHBlY3QoZXJyLm1lc3NhZ2UpLnRvTWF0Y2goL2RvZXMgbm90IGV4aXN0LykpO1xuICpcbiAqICAgLy8gQ3JlYXRlIHRoZSBmaWxlIHdpdGggbmV3IGNvbnRlbnQgYW5kIHZlcmlmeSB0aGF0IHRoaXMgaGFzIHRoZSBuZXcgY29udGVudC5cbiAqICAgYUhvc3Qud3JpdGUobm9ybWFsaXplKCcvb3RoZXIvZm9sZGVyL2ZpbGUnKSwgY29udGVudDIpLnN1YnNjcmliZSgpO1xuICogICBhSG9zdC5yZWFkKG5vcm1hbGl6ZSgnL3NvbWUvZm9sZGVyL2ZpbGUnKSlcbiAqICAgICAuc3Vic2NyaWJlKHggPT4gZXhwZWN0KHgpLnRvQmUoY29udGVudDIpKTtcbiAqL1xuZXhwb3J0IGNsYXNzIEFsaWFzSG9zdDxTdGF0c1QgZXh0ZW5kcyBvYmplY3QgPSB7fT4gZXh0ZW5kcyBSZXNvbHZlckhvc3Q8U3RhdHNUPiB7XG4gIHByb3RlY3RlZCBfYWxpYXNlcyA9IG5ldyBNYXA8UGF0aCwgUGF0aD4oKTtcblxuICBwcm90ZWN0ZWQgX3Jlc29sdmUocGF0aDogUGF0aCkge1xuICAgIGxldCBtYXliZUFsaWFzID0gdGhpcy5fYWxpYXNlcy5nZXQocGF0aCk7XG4gICAgY29uc3Qgc3AgPSBzcGxpdChwYXRoKTtcbiAgICBjb25zdCByZW1haW5pbmc6IFBhdGhGcmFnbWVudFtdID0gW107XG5cbiAgICAvLyBBbHNvIHJlc29sdmUgYWxsIHBhcmVudHMgb2YgdGhlIHJlcXVlc3RlZCBmaWxlcywgb25seSBwaWNraW5nIHRoZSBmaXJzdCBvbmUgdGhhdCBtYXRjaGVzLlxuICAgIC8vIFRoaXMgY2FuIGhhdmUgc3VycHJpc2luZyBiZWhhdmlvdXIgd2hlbiBhbGlhc2VzIGFyZSBpbnNpZGUgYW5vdGhlciBhbGlhcy4gSXQgd2lsbCBhbHdheXNcbiAgICAvLyB1c2UgdGhlIGNsb3Nlc3Qgb25lIHRvIHRoZSBmaWxlLlxuICAgIHdoaWxlICghbWF5YmVBbGlhcyAmJiBzcC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBwID0gam9pbihOb3JtYWxpemVkUm9vdCwgLi4uc3ApO1xuICAgICAgbWF5YmVBbGlhcyA9IHRoaXMuX2FsaWFzZXMuZ2V0KHApO1xuXG4gICAgICBpZiAobWF5YmVBbGlhcykge1xuICAgICAgICBtYXliZUFsaWFzID0gam9pbihtYXliZUFsaWFzLCAuLi5yZW1haW5pbmcpO1xuICAgICAgfVxuICAgICAgLy8gQWxsb3cgbm9uLW51bGwtb3BlcmF0b3IgYmVjYXVzZSB3ZSBrbm93IHNwLmxlbmd0aCA+IDAgKGNvbmRpdGlvbiBvbiB3aGlsZSkuXG4gICAgICByZW1haW5pbmcudW5zaGlmdChzcC5wb3AoKSEpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICB9XG5cbiAgICByZXR1cm4gbWF5YmVBbGlhcyB8fCBwYXRoO1xuICB9XG5cbiAgZ2V0IGFsaWFzZXMoKTogTWFwPFBhdGgsIFBhdGg+IHtcbiAgICByZXR1cm4gdGhpcy5fYWxpYXNlcztcbiAgfVxufVxuIl19