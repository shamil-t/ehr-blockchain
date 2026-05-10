import type { GlobalOptionDefinitions, GlobalOptions } from "../../types/global-options.js";
import type { HardhatRuntimeEnvironment } from "../../types/hre.js";
import type { Task, TaskArguments } from "../../types/tasks.js";
export interface MainOptions {
    print?: (message: string) => void;
    registerTsx?: boolean;
    rethrowErrors?: true;
    allowNonlocalHardhatInstallation?: true;
}
export declare function main(rawArguments: string[], options?: MainOptions): Promise<void>;
export declare function parseBuiltinGlobalOptions(cliArguments: string[], usedCliArguments: boolean[]): Promise<{
    init: boolean;
    configPath: string | undefined;
    showStackTraces: boolean;
    help: boolean;
    version: boolean;
}>;
export declare function parseGlobalOptions(globalOptionDefinitions: GlobalOptionDefinitions, cliArguments: string[], usedCliArguments: boolean[]): Promise<Partial<GlobalOptions>>;
/**
 * Parses the task from the cli args.
 *
 * @returns The task, or an array with the unrecognized task id.
 * If no task id is provided, an empty array is returned.
 */
export declare function parseTask(cliArguments: string[], usedCliArguments: boolean[], hre: HardhatRuntimeEnvironment): Task | string[];
export declare function parseTaskArguments(cliArguments: string[], usedCliArguments: boolean[], task: Task): TaskArguments;
/**
 * Parses the raw arguments from the command line, returning an array of
 * arguments. If an argument starts with "--" and contains "=" (i.e. "--option=123")
 * it is split into two separate arguments: the option name and the option value.
 */
export declare function parseRawArguments(rawArguments: string[]): string[];
//# sourceMappingURL=main.d.ts.map