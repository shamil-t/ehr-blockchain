"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const command_module_1 = require("../../command-builder/command-module");
const color_1 = require("../../utilities/color");
class AwesomeCommandModule extends command_module_1.CommandModule {
    constructor() {
        super(...arguments);
        this.command = 'make-this-awesome';
        this.describe = false;
        this.deprecated = false;
    }
    builder(localYargs) {
        return localYargs;
    }
    run() {
        const pickOne = (of) => of[Math.floor(Math.random() * of.length)];
        const phrase = pickOne([
            `You're on it, there's nothing for me to do!`,
            `Let's take a look... nope, it's all good!`,
            `You're doing fine.`,
            `You're already doing great.`,
            `Nothing to do; already awesome. Exiting.`,
            `Error 418: As Awesome As Can Get.`,
            `I spy with my little eye a great developer!`,
            `Noop... already awesome.`,
        ]);
        this.context.logger.info(color_1.colors.green(phrase));
    }
}
exports.default = AwesomeCommandModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL21ha2UtdGhpcy1hd2Vzb21lL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUdILHlFQUFrRztBQUNsRyxpREFBK0M7QUFFL0MsTUFBcUIsb0JBQ25CLFNBQVEsOEJBQWE7SUFEdkI7O1FBSUUsWUFBTyxHQUFHLG1CQUFtQixDQUFDO1FBQzlCLGFBQVEsR0FBRyxLQUFjLENBQUM7UUFDMUIsZUFBVSxHQUFHLEtBQUssQ0FBQztJQXVCckIsQ0FBQztJQXBCQyxPQUFPLENBQUMsVUFBZ0I7UUFDdEIsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUVELEdBQUc7UUFDRCxNQUFNLE9BQU8sR0FBRyxDQUFDLEVBQVksRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBRTVFLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQztZQUNyQiw2Q0FBNkM7WUFDN0MsMkNBQTJDO1lBQzNDLG9CQUFvQjtZQUNwQiw2QkFBNkI7WUFDN0IsMENBQTBDO1lBQzFDLG1DQUFtQztZQUNuQyw2Q0FBNkM7WUFDN0MsMEJBQTBCO1NBQzNCLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDakQsQ0FBQztDQUNGO0FBN0JELHVDQTZCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBBcmd2IH0gZnJvbSAneWFyZ3MnO1xuaW1wb3J0IHsgQ29tbWFuZE1vZHVsZSwgQ29tbWFuZE1vZHVsZUltcGxlbWVudGF0aW9uIH0gZnJvbSAnLi4vLi4vY29tbWFuZC1idWlsZGVyL2NvbW1hbmQtbW9kdWxlJztcbmltcG9ydCB7IGNvbG9ycyB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy9jb2xvcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEF3ZXNvbWVDb21tYW5kTW9kdWxlXG4gIGV4dGVuZHMgQ29tbWFuZE1vZHVsZVxuICBpbXBsZW1lbnRzIENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvblxue1xuICBjb21tYW5kID0gJ21ha2UtdGhpcy1hd2Vzb21lJztcbiAgZGVzY3JpYmUgPSBmYWxzZSBhcyBjb25zdDtcbiAgZGVwcmVjYXRlZCA9IGZhbHNlO1xuICBsb25nRGVzY3JpcHRpb25QYXRoPzogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gIGJ1aWxkZXIobG9jYWxZYXJnczogQXJndik6IEFyZ3Yge1xuICAgIHJldHVybiBsb2NhbFlhcmdzO1xuICB9XG5cbiAgcnVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHBpY2tPbmUgPSAob2Y6IHN0cmluZ1tdKSA9PiBvZltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBvZi5sZW5ndGgpXTtcblxuICAgIGNvbnN0IHBocmFzZSA9IHBpY2tPbmUoW1xuICAgICAgYFlvdSdyZSBvbiBpdCwgdGhlcmUncyBub3RoaW5nIGZvciBtZSB0byBkbyFgLFxuICAgICAgYExldCdzIHRha2UgYSBsb29rLi4uIG5vcGUsIGl0J3MgYWxsIGdvb2QhYCxcbiAgICAgIGBZb3UncmUgZG9pbmcgZmluZS5gLFxuICAgICAgYFlvdSdyZSBhbHJlYWR5IGRvaW5nIGdyZWF0LmAsXG4gICAgICBgTm90aGluZyB0byBkbzsgYWxyZWFkeSBhd2Vzb21lLiBFeGl0aW5nLmAsXG4gICAgICBgRXJyb3IgNDE4OiBBcyBBd2Vzb21lIEFzIENhbiBHZXQuYCxcbiAgICAgIGBJIHNweSB3aXRoIG15IGxpdHRsZSBleWUgYSBncmVhdCBkZXZlbG9wZXIhYCxcbiAgICAgIGBOb29wLi4uIGFscmVhZHkgYXdlc29tZS5gLFxuICAgIF0pO1xuXG4gICAgdGhpcy5jb250ZXh0LmxvZ2dlci5pbmZvKGNvbG9ycy5ncmVlbihwaHJhc2UpKTtcbiAgfVxufVxuIl19