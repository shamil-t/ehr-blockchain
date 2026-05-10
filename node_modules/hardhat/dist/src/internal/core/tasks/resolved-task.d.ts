import type { OptionDefinition, PositionalArgumentDefinition } from "../../../types/arguments.js";
import type { HardhatRuntimeEnvironment } from "../../../types/hre.js";
import type { Task, TaskAction, TaskActions, TaskArguments } from "../../../types/tasks.js";
export declare class ResolvedTask implements Task {
    #private;
    readonly id: string[];
    readonly description: string;
    readonly actions: TaskActions;
    readonly options: Map<string, OptionDefinition>;
    readonly positionalArguments: PositionalArgumentDefinition[];
    readonly pluginId: string | undefined;
    readonly subtasks: Map<string, Task>;
    static createEmptyTask(hre: HardhatRuntimeEnvironment, id: string[], description: string, pluginId?: string): ResolvedTask;
    static createNewTask(hre: HardhatRuntimeEnvironment, id: string[], description: string, taskAction: TaskAction, options: Record<string, OptionDefinition>, positionalArguments: PositionalArgumentDefinition[], pluginId?: string): ResolvedTask;
    constructor(id: string[], description: string, actions: TaskActions, options: Map<string, OptionDefinition>, positionalArguments: PositionalArgumentDefinition[], pluginId: string | undefined, subtasks: Map<string, Task>, hre: HardhatRuntimeEnvironment);
    get isEmpty(): boolean;
    /**
     * This method runs the task with the given arguments.
     * It validates the arguments, resolves the file actions, and runs the task
     * actions by calling them in order.
     *
     * @param taskArguments The arguments to run the task with.
     * @returns The result of running the task.
     * @throws HardhatError if the task is empty, a required argument is missing,
     * a argument has an invalid type, or the file actions can't be resolved.
     */
    run(taskArguments?: TaskArguments): Promise<any>;
}
//# sourceMappingURL=resolved-task.d.ts.map