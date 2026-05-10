import type { NewTaskActionFunction } from "../../../types/tasks.js";
interface RunActionArguments {
    script: string;
    noCompile: boolean;
}
declare const runScriptWithHardhat: NewTaskActionFunction<RunActionArguments>;
export default runScriptWithHardhat;
//# sourceMappingURL=task-action.d.ts.map