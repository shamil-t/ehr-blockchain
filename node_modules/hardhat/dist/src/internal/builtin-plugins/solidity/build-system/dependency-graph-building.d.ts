import type { HookManager } from "../../../../types/hooks.js";
import { DependencyGraphImplementation } from "./dependency-graph.js";
export declare function buildDependencyGraph(rootFiles: string[], projectRoot: string, readFile: (absPath: string) => Promise<string>, hookManager: HookManager): Promise<DependencyGraphImplementation>;
//# sourceMappingURL=dependency-graph-building.d.ts.map