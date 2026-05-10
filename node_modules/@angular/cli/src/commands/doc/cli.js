"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const open_1 = __importDefault(require("open"));
const command_module_1 = require("../../command-builder/command-module");
const command_config_1 = require("../command-config");
class DocCommandModule extends command_module_1.CommandModule {
    constructor() {
        super(...arguments);
        this.command = 'doc <keyword>';
        this.aliases = command_config_1.RootCommands['doc'].aliases;
        this.describe = 'Opens the official Angular documentation (angular.io) in a browser, and searches for a given keyword.';
    }
    builder(localYargs) {
        return localYargs
            .positional('keyword', {
            description: 'The keyword to search for, as provided in the search bar in angular.io.',
            type: 'string',
            demandOption: true,
        })
            .option('search', {
            description: `Search all of angular.io. Otherwise, searches only API reference documentation.`,
            alias: ['s'],
            type: 'boolean',
            default: false,
        })
            .option('version', {
            description: 'The version of Angular to use for the documentation. ' +
                'If not provided, the command uses your current Angular core version.',
            type: 'string',
        })
            .strict();
    }
    async run(options) {
        let domain = 'angular.io';
        if (options.version) {
            // version can either be a string containing "next"
            if (options.version === 'next') {
                domain = 'next.angular.io';
            }
            else if (options.version === 'rc') {
                domain = 'rc.angular.io';
                // or a number where version must be a valid Angular version (i.e. not 0, 1 or 3)
            }
            else if (!isNaN(+options.version) && ![0, 1, 3].includes(+options.version)) {
                domain = `v${options.version}.angular.io`;
            }
            else {
                this.context.logger.error('Version should either be a number (2, 4, 5, 6...), "rc" or "next"');
                return 1;
            }
        }
        else {
            // we try to get the current Angular version of the project
            // and use it if we can find it
            try {
                /* eslint-disable-next-line import/no-extraneous-dependencies */
                const currentNgVersion = (await Promise.resolve().then(() => __importStar(require('@angular/core')))).VERSION.major;
                domain = `v${currentNgVersion}.angular.io`;
            }
            catch { }
        }
        await (0, open_1.default)(options.search
            ? `https://${domain}/docs?search=${options.keyword}`
            : `https://${domain}/api?query=${options.keyword}`);
    }
}
exports.default = DocCommandModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL2RvYy9jbGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGdEQUF3QjtBQUV4Qix5RUFJOEM7QUFDOUMsc0RBQWlEO0FBUWpELE1BQXFCLGdCQUNuQixTQUFRLDhCQUE2QjtJQUR2Qzs7UUFJRSxZQUFPLEdBQUcsZUFBZSxDQUFDO1FBQzFCLFlBQU8sR0FBRyw2QkFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUN0QyxhQUFRLEdBQ04sdUdBQXVHLENBQUM7SUE0RDVHLENBQUM7SUF6REMsT0FBTyxDQUFDLFVBQWdCO1FBQ3RCLE9BQU8sVUFBVTthQUNkLFVBQVUsQ0FBQyxTQUFTLEVBQUU7WUFDckIsV0FBVyxFQUFFLHlFQUF5RTtZQUN0RixJQUFJLEVBQUUsUUFBUTtZQUNkLFlBQVksRUFBRSxJQUFJO1NBQ25CLENBQUM7YUFDRCxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQ2hCLFdBQVcsRUFBRSxpRkFBaUY7WUFDOUYsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ1osSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFPLEVBQUUsS0FBSztTQUNmLENBQUM7YUFDRCxNQUFNLENBQUMsU0FBUyxFQUFFO1lBQ2pCLFdBQVcsRUFDVCx1REFBdUQ7Z0JBQ3ZELHNFQUFzRTtZQUN4RSxJQUFJLEVBQUUsUUFBUTtTQUNmLENBQUM7YUFDRCxNQUFNLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQWdDO1FBQ3hDLElBQUksTUFBTSxHQUFHLFlBQVksQ0FBQztRQUUxQixJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUU7WUFDbkIsbURBQW1EO1lBQ25ELElBQUksT0FBTyxDQUFDLE9BQU8sS0FBSyxNQUFNLEVBQUU7Z0JBQzlCLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQzthQUM1QjtpQkFBTSxJQUFJLE9BQU8sQ0FBQyxPQUFPLEtBQUssSUFBSSxFQUFFO2dCQUNuQyxNQUFNLEdBQUcsZUFBZSxDQUFDO2dCQUN6QixpRkFBaUY7YUFDbEY7aUJBQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQzVFLE1BQU0sR0FBRyxJQUFJLE9BQU8sQ0FBQyxPQUFPLGFBQWEsQ0FBQzthQUMzQztpQkFBTTtnQkFDTCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ3ZCLG1FQUFtRSxDQUNwRSxDQUFDO2dCQUVGLE9BQU8sQ0FBQyxDQUFDO2FBQ1Y7U0FDRjthQUFNO1lBQ0wsMkRBQTJEO1lBQzNELCtCQUErQjtZQUMvQixJQUFJO2dCQUNGLGdFQUFnRTtnQkFDaEUsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLHdEQUFhLGVBQWUsR0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztnQkFDdkUsTUFBTSxHQUFHLElBQUksZ0JBQWdCLGFBQWEsQ0FBQzthQUM1QztZQUFDLE1BQU0sR0FBRTtTQUNYO1FBRUQsTUFBTSxJQUFBLGNBQUksRUFDUixPQUFPLENBQUMsTUFBTTtZQUNaLENBQUMsQ0FBQyxXQUFXLE1BQU0sZ0JBQWdCLE9BQU8sQ0FBQyxPQUFPLEVBQUU7WUFDcEQsQ0FBQyxDQUFDLFdBQVcsTUFBTSxjQUFjLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FDckQsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQW5FRCxtQ0FtRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IG9wZW4gZnJvbSAnb3Blbic7XG5pbXBvcnQgeyBBcmd2IH0gZnJvbSAneWFyZ3MnO1xuaW1wb3J0IHtcbiAgQ29tbWFuZE1vZHVsZSxcbiAgQ29tbWFuZE1vZHVsZUltcGxlbWVudGF0aW9uLFxuICBPcHRpb25zLFxufSBmcm9tICcuLi8uLi9jb21tYW5kLWJ1aWxkZXIvY29tbWFuZC1tb2R1bGUnO1xuaW1wb3J0IHsgUm9vdENvbW1hbmRzIH0gZnJvbSAnLi4vY29tbWFuZC1jb25maWcnO1xuXG5pbnRlcmZhY2UgRG9jQ29tbWFuZEFyZ3Mge1xuICBrZXl3b3JkOiBzdHJpbmc7XG4gIHNlYXJjaD86IGJvb2xlYW47XG4gIHZlcnNpb24/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERvY0NvbW1hbmRNb2R1bGVcbiAgZXh0ZW5kcyBDb21tYW5kTW9kdWxlPERvY0NvbW1hbmRBcmdzPlxuICBpbXBsZW1lbnRzIENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvbjxEb2NDb21tYW5kQXJncz5cbntcbiAgY29tbWFuZCA9ICdkb2MgPGtleXdvcmQ+JztcbiAgYWxpYXNlcyA9IFJvb3RDb21tYW5kc1snZG9jJ10uYWxpYXNlcztcbiAgZGVzY3JpYmUgPVxuICAgICdPcGVucyB0aGUgb2ZmaWNpYWwgQW5ndWxhciBkb2N1bWVudGF0aW9uIChhbmd1bGFyLmlvKSBpbiBhIGJyb3dzZXIsIGFuZCBzZWFyY2hlcyBmb3IgYSBnaXZlbiBrZXl3b3JkLic7XG4gIGxvbmdEZXNjcmlwdGlvblBhdGg/OiBzdHJpbmc7XG5cbiAgYnVpbGRlcihsb2NhbFlhcmdzOiBBcmd2KTogQXJndjxEb2NDb21tYW5kQXJncz4ge1xuICAgIHJldHVybiBsb2NhbFlhcmdzXG4gICAgICAucG9zaXRpb25hbCgna2V5d29yZCcsIHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaGUga2V5d29yZCB0byBzZWFyY2ggZm9yLCBhcyBwcm92aWRlZCBpbiB0aGUgc2VhcmNoIGJhciBpbiBhbmd1bGFyLmlvLicsXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICBkZW1hbmRPcHRpb246IHRydWUsXG4gICAgICB9KVxuICAgICAgLm9wdGlvbignc2VhcmNoJywge1xuICAgICAgICBkZXNjcmlwdGlvbjogYFNlYXJjaCBhbGwgb2YgYW5ndWxhci5pby4gT3RoZXJ3aXNlLCBzZWFyY2hlcyBvbmx5IEFQSSByZWZlcmVuY2UgZG9jdW1lbnRhdGlvbi5gLFxuICAgICAgICBhbGlhczogWydzJ10sXG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICB9KVxuICAgICAgLm9wdGlvbigndmVyc2lvbicsIHtcbiAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgJ1RoZSB2ZXJzaW9uIG9mIEFuZ3VsYXIgdG8gdXNlIGZvciB0aGUgZG9jdW1lbnRhdGlvbi4gJyArXG4gICAgICAgICAgJ0lmIG5vdCBwcm92aWRlZCwgdGhlIGNvbW1hbmQgdXNlcyB5b3VyIGN1cnJlbnQgQW5ndWxhciBjb3JlIHZlcnNpb24uJyxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICB9KVxuICAgICAgLnN0cmljdCgpO1xuICB9XG5cbiAgYXN5bmMgcnVuKG9wdGlvbnM6IE9wdGlvbnM8RG9jQ29tbWFuZEFyZ3M+KTogUHJvbWlzZTxudW1iZXIgfCB2b2lkPiB7XG4gICAgbGV0IGRvbWFpbiA9ICdhbmd1bGFyLmlvJztcblxuICAgIGlmIChvcHRpb25zLnZlcnNpb24pIHtcbiAgICAgIC8vIHZlcnNpb24gY2FuIGVpdGhlciBiZSBhIHN0cmluZyBjb250YWluaW5nIFwibmV4dFwiXG4gICAgICBpZiAob3B0aW9ucy52ZXJzaW9uID09PSAnbmV4dCcpIHtcbiAgICAgICAgZG9tYWluID0gJ25leHQuYW5ndWxhci5pbyc7XG4gICAgICB9IGVsc2UgaWYgKG9wdGlvbnMudmVyc2lvbiA9PT0gJ3JjJykge1xuICAgICAgICBkb21haW4gPSAncmMuYW5ndWxhci5pbyc7XG4gICAgICAgIC8vIG9yIGEgbnVtYmVyIHdoZXJlIHZlcnNpb24gbXVzdCBiZSBhIHZhbGlkIEFuZ3VsYXIgdmVyc2lvbiAoaS5lLiBub3QgMCwgMSBvciAzKVxuICAgICAgfSBlbHNlIGlmICghaXNOYU4oK29wdGlvbnMudmVyc2lvbikgJiYgIVswLCAxLCAzXS5pbmNsdWRlcygrb3B0aW9ucy52ZXJzaW9uKSkge1xuICAgICAgICBkb21haW4gPSBgdiR7b3B0aW9ucy52ZXJzaW9ufS5hbmd1bGFyLmlvYDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY29udGV4dC5sb2dnZXIuZXJyb3IoXG4gICAgICAgICAgJ1ZlcnNpb24gc2hvdWxkIGVpdGhlciBiZSBhIG51bWJlciAoMiwgNCwgNSwgNi4uLiksIFwicmNcIiBvciBcIm5leHRcIicsXG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHdlIHRyeSB0byBnZXQgdGhlIGN1cnJlbnQgQW5ndWxhciB2ZXJzaW9uIG9mIHRoZSBwcm9qZWN0XG4gICAgICAvLyBhbmQgdXNlIGl0IGlmIHdlIGNhbiBmaW5kIGl0XG4gICAgICB0cnkge1xuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWV4dHJhbmVvdXMtZGVwZW5kZW5jaWVzICovXG4gICAgICAgIGNvbnN0IGN1cnJlbnROZ1ZlcnNpb24gPSAoYXdhaXQgaW1wb3J0KCdAYW5ndWxhci9jb3JlJykpLlZFUlNJT04ubWFqb3I7XG4gICAgICAgIGRvbWFpbiA9IGB2JHtjdXJyZW50TmdWZXJzaW9ufS5hbmd1bGFyLmlvYDtcbiAgICAgIH0gY2F0Y2gge31cbiAgICB9XG5cbiAgICBhd2FpdCBvcGVuKFxuICAgICAgb3B0aW9ucy5zZWFyY2hcbiAgICAgICAgPyBgaHR0cHM6Ly8ke2RvbWFpbn0vZG9jcz9zZWFyY2g9JHtvcHRpb25zLmtleXdvcmR9YFxuICAgICAgICA6IGBodHRwczovLyR7ZG9tYWlufS9hcGk/cXVlcnk9JHtvcHRpb25zLmtleXdvcmR9YCxcbiAgICApO1xuICB9XG59XG4iXX0=