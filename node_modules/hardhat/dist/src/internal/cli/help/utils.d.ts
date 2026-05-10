import type { ArgumentType, ArgumentTypeToValueType } from "../../../types/arguments.js";
import type { GlobalOptionDefinitions } from "../../../types/global-options.js";
import type { Task } from "../../../types/tasks.js";
export declare const GLOBAL_NAME_PADDING = 6;
interface ArgumentDescriptor {
    name: string;
    shortName?: string;
    description: string;
    type?: ArgumentType;
    defaultValue?: ArgumentTypeToValueType<ArgumentType>;
    isRequired?: boolean;
}
export declare function parseGlobalOptions(globalOptionDefinitions: GlobalOptionDefinitions): ArgumentDescriptor[];
export declare function parseTasks(taskMap: Map<string, Task>): {
    tasks: ArgumentDescriptor[];
    subtasks: ArgumentDescriptor[];
};
export declare function parseSubtasks(task: Task): ArgumentDescriptor[];
export declare function parseOptions(task: Task): {
    options: ArgumentDescriptor[];
    positionalArguments: ArgumentDescriptor[];
};
export declare function toCommandLineOption(optionName: string): string;
export declare function toShortCommandLineOption(optionShortName?: string): string | undefined;
export declare function getLongestNameLength(tasks: Array<{
    name: string;
    shortName?: string;
}>): number;
export declare function getSection(title: string, items: ArgumentDescriptor[], namePadding: number): string;
export declare function getUsageString(task: Task, options: ReturnType<typeof parseOptions>["options"], positionalArguments: ReturnType<typeof parseOptions>["positionalArguments"]): string;
export {};
//# sourceMappingURL=utils.d.ts.map