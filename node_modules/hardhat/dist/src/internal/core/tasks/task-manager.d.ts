import type { GlobalOptionDefinitions } from "../../../types/global-options.js";
import type { HardhatRuntimeEnvironment } from "../../../types/hre.js";
import type { Task, TaskManager } from "../../../types/tasks.js";
export declare class TaskManagerImplementation implements TaskManager {
    #private;
    constructor(hre: HardhatRuntimeEnvironment, globalOptionDefinitions: GlobalOptionDefinitions);
    get rootTasks(): Map<string, Task>;
    getTask(taskId: string | string[]): Task;
}
//# sourceMappingURL=task-manager.d.ts.map