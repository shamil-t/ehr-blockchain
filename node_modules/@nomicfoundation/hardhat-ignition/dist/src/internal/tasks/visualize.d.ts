import type { NewTaskActionFunction } from "hardhat/types/tasks";
interface TaskVisualizeArguments {
    modulePath: string;
    noOpen: boolean;
}
declare const visualizeTask: NewTaskActionFunction<TaskVisualizeArguments>;
export default visualizeTask;
//# sourceMappingURL=visualize.d.ts.map