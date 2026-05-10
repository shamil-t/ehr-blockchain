import type { NewTaskActionFunction } from "hardhat/types/tasks";
interface TaskWipeArguments {
    deploymentId: string;
    futureId: string;
}
declare const taskWipe: NewTaskActionFunction<TaskWipeArguments>;
export default taskWipe;
//# sourceMappingURL=wipe.d.ts.map