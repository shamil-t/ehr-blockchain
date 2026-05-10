import type { NewTaskActionFunction } from "../../../types/tasks.js";
interface NodeActionArguments {
    hostname?: string;
    port: number;
    chainType?: string;
    chainId: number;
    fork?: string;
    forkBlockNumber: number;
}
declare const nodeAction: NewTaskActionFunction<NodeActionArguments>;
export default nodeAction;
//# sourceMappingURL=task-action.d.ts.map