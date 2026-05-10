"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheEnableModule = exports.CacheDisableModule = void 0;
const command_module_1 = require("../../../command-builder/command-module");
const utilities_1 = require("../utilities");
class CacheDisableModule extends command_module_1.CommandModule {
    constructor() {
        super(...arguments);
        this.command = 'disable';
        this.aliases = 'off';
        this.describe = 'Disables persistent disk cache for all projects in the workspace.';
        this.scope = command_module_1.CommandScope.In;
    }
    builder(localYargs) {
        return localYargs;
    }
    run() {
        return (0, utilities_1.updateCacheConfig)(this.getWorkspaceOrThrow(), 'enabled', false);
    }
}
exports.CacheDisableModule = CacheDisableModule;
class CacheEnableModule extends command_module_1.CommandModule {
    constructor() {
        super(...arguments);
        this.command = 'enable';
        this.aliases = 'on';
        this.describe = 'Enables disk cache for all projects in the workspace.';
        this.scope = command_module_1.CommandScope.In;
    }
    builder(localYargs) {
        return localYargs;
    }
    run() {
        return (0, utilities_1.updateCacheConfig)(this.getWorkspaceOrThrow(), 'enabled', true);
    }
}
exports.CacheEnableModule = CacheEnableModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL2NhY2hlL3NldHRpbmdzL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFHSCw0RUFJaUQ7QUFDakQsNENBQWlEO0FBRWpELE1BQWEsa0JBQW1CLFNBQVEsOEJBQWE7SUFBckQ7O1FBQ0UsWUFBTyxHQUFHLFNBQVMsQ0FBQztRQUNwQixZQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ2hCLGFBQVEsR0FBRyxtRUFBbUUsQ0FBQztRQUV0RSxVQUFLLEdBQUcsNkJBQVksQ0FBQyxFQUFFLENBQUM7SUFTbkMsQ0FBQztJQVBDLE9BQU8sQ0FBQyxVQUFnQjtRQUN0QixPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0lBRUQsR0FBRztRQUNELE9BQU8sSUFBQSw2QkFBaUIsRUFBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDekUsQ0FBQztDQUNGO0FBZEQsZ0RBY0M7QUFFRCxNQUFhLGlCQUFrQixTQUFRLDhCQUFhO0lBQXBEOztRQUNFLFlBQU8sR0FBRyxRQUFRLENBQUM7UUFDbkIsWUFBTyxHQUFHLElBQUksQ0FBQztRQUNmLGFBQVEsR0FBRyx1REFBdUQsQ0FBQztRQUUxRCxVQUFLLEdBQUcsNkJBQVksQ0FBQyxFQUFFLENBQUM7SUFTbkMsQ0FBQztJQVBDLE9BQU8sQ0FBQyxVQUFnQjtRQUN0QixPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0lBRUQsR0FBRztRQUNELE9BQU8sSUFBQSw2QkFBaUIsRUFBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDeEUsQ0FBQztDQUNGO0FBZEQsOENBY0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQXJndiB9IGZyb20gJ3lhcmdzJztcbmltcG9ydCB7XG4gIENvbW1hbmRNb2R1bGUsXG4gIENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvbixcbiAgQ29tbWFuZFNjb3BlLFxufSBmcm9tICcuLi8uLi8uLi9jb21tYW5kLWJ1aWxkZXIvY29tbWFuZC1tb2R1bGUnO1xuaW1wb3J0IHsgdXBkYXRlQ2FjaGVDb25maWcgfSBmcm9tICcuLi91dGlsaXRpZXMnO1xuXG5leHBvcnQgY2xhc3MgQ2FjaGVEaXNhYmxlTW9kdWxlIGV4dGVuZHMgQ29tbWFuZE1vZHVsZSBpbXBsZW1lbnRzIENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvbiB7XG4gIGNvbW1hbmQgPSAnZGlzYWJsZSc7XG4gIGFsaWFzZXMgPSAnb2ZmJztcbiAgZGVzY3JpYmUgPSAnRGlzYWJsZXMgcGVyc2lzdGVudCBkaXNrIGNhY2hlIGZvciBhbGwgcHJvamVjdHMgaW4gdGhlIHdvcmtzcGFjZS4nO1xuICBsb25nRGVzY3JpcHRpb25QYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIG92ZXJyaWRlIHNjb3BlID0gQ29tbWFuZFNjb3BlLkluO1xuXG4gIGJ1aWxkZXIobG9jYWxZYXJnczogQXJndik6IEFyZ3Yge1xuICAgIHJldHVybiBsb2NhbFlhcmdzO1xuICB9XG5cbiAgcnVuKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB1cGRhdGVDYWNoZUNvbmZpZyh0aGlzLmdldFdvcmtzcGFjZU9yVGhyb3coKSwgJ2VuYWJsZWQnLCBmYWxzZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIENhY2hlRW5hYmxlTW9kdWxlIGV4dGVuZHMgQ29tbWFuZE1vZHVsZSBpbXBsZW1lbnRzIENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvbiB7XG4gIGNvbW1hbmQgPSAnZW5hYmxlJztcbiAgYWxpYXNlcyA9ICdvbic7XG4gIGRlc2NyaWJlID0gJ0VuYWJsZXMgZGlzayBjYWNoZSBmb3IgYWxsIHByb2plY3RzIGluIHRoZSB3b3Jrc3BhY2UuJztcbiAgbG9uZ0Rlc2NyaXB0aW9uUGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBvdmVycmlkZSBzY29wZSA9IENvbW1hbmRTY29wZS5JbjtcblxuICBidWlsZGVyKGxvY2FsWWFyZ3M6IEFyZ3YpOiBBcmd2IHtcbiAgICByZXR1cm4gbG9jYWxZYXJncztcbiAgfVxuXG4gIHJ1bigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdXBkYXRlQ2FjaGVDb25maWcodGhpcy5nZXRXb3Jrc3BhY2VPclRocm93KCksICdlbmFibGVkJywgdHJ1ZSk7XG4gIH1cbn1cbiJdfQ==