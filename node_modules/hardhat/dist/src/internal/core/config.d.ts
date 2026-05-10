import type { ArgumentTypeToValueType, GlobalOptionDefinition } from "../../types/arguments.js";
import type { ConfigurationVariable } from "../../types/config.js";
import type { EmptyTaskDefinitionBuilder, NewTaskDefinitionBuilder, TaskOverrideDefinitionBuilder } from "../../types/tasks.js";
import { ArgumentType } from "../../types/arguments.js";
/**
 * Creates a configuration variable, which will be fetched at runtime.
 */
export declare function configVariable(name: string, format?: string): ConfigurationVariable;
/**
 * Creates a builder to define a new task.
 */
export declare function task(id: string | string[], description?: string): NewTaskDefinitionBuilder;
/**
 * Defines a new empty task.
 */
export declare function emptyTask(id: string | string[], description: string): EmptyTaskDefinitionBuilder;
/**
 * Creates a builder to override a task.
 */
export declare function overrideTask(id: string | string[]): TaskOverrideDefinitionBuilder;
/**
 * Defines a global option.
 */
export declare function globalOption<T extends ArgumentType>(options: {
    name: string;
    shortName?: string;
    description: string;
    type?: T;
    defaultValue: ArgumentTypeToValueType<T>;
}): GlobalOptionDefinition;
/**
 * Defines a global flag.
 */
export declare function globalFlag(options: {
    name: string;
    shortName?: string;
    description: string;
}): GlobalOptionDefinition;
/**
 * Defines a global level.
 */
export declare function globalLevel(options: {
    name: string;
    shortName?: string;
    description: string;
    defaultValue?: number;
}): GlobalOptionDefinition;
//# sourceMappingURL=config.d.ts.map