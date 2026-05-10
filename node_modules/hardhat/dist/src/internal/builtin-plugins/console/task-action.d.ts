import type { NewTaskActionFunction } from "../../../types/tasks.js";
import repl from "node:repl";
interface ConsoleActionArguments {
    commands: string[];
    history: string;
    noCompile: boolean;
    options?: repl.ReplOptions;
}
declare const consoleAction: NewTaskActionFunction<ConsoleActionArguments>;
export default consoleAction;
//# sourceMappingURL=task-action.d.ts.map