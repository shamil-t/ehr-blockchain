import type { HardhatUserConfig, ProjectPathsUserConfig } from "../../types/config.js";
import type { HardhatUserConfigValidationError, HookManager } from "../../types/hooks.js";
import type { HardhatPlugin } from "../../types/plugins.js";
import { type OptionDefinition, type PositionalArgumentDefinition } from "../../types/arguments.js";
import { type EmptyTaskDefinition, type NewTaskDefinition, type TaskDefinition, type TaskOverrideDefinition } from "../../types/tasks.js";
export declare function validateUserConfig(hooks: HookManager, config: HardhatUserConfig): Promise<HardhatUserConfigValidationError[]>;
export declare function collectValidationErrorsForUserConfig(config: HardhatUserConfig): HardhatUserConfigValidationError[];
export declare function validatePaths(paths: ProjectPathsUserConfig): HardhatUserConfigValidationError[];
export declare function validateTasksConfig(tasks: TaskDefinition[], path?: Array<string | number>, isPlugin?: boolean): HardhatUserConfigValidationError[];
export declare function validateEmptyTask(task: EmptyTaskDefinition, path: Array<string | number>): HardhatUserConfigValidationError[];
export declare function validateNewTask(task: NewTaskDefinition, path: Array<string | number>, isPlugin?: boolean): HardhatUserConfigValidationError[];
export declare function validateTaskOverride(task: TaskOverrideDefinition, path: Array<string | number>, isPlugin?: boolean): HardhatUserConfigValidationError[];
export declare function validateOptions(options: Record<string, OptionDefinition>, path: Array<string | number>): HardhatUserConfigValidationError[];
export declare function validatePositionalArguments(positionalArgs: PositionalArgumentDefinition[], path: Array<string | number>): HardhatUserConfigValidationError[];
export declare function validatePluginsConfig(plugins: HardhatPlugin[], path?: Array<string | number>): HardhatUserConfigValidationError[];
//# sourceMappingURL=config-validation.d.ts.map