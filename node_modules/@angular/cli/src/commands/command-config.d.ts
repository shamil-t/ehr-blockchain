/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { CommandModuleConstructor } from '../command-builder/utilities/command';
export type CommandNames = 'add' | 'analytics' | 'build' | 'cache' | 'completion' | 'config' | 'deploy' | 'doc' | 'e2e' | 'extract-i18n' | 'generate' | 'lint' | 'make-this-awesome' | 'new' | 'run' | 'serve' | 'test' | 'update' | 'version';
export interface CommandConfig {
    aliases?: string[];
    factory: () => Promise<{
        default: CommandModuleConstructor;
    }>;
}
export declare const RootCommands: Record<CommandNames & string, CommandConfig>;
export declare const RootCommandsAliases: Record<string, CommandConfig>;
