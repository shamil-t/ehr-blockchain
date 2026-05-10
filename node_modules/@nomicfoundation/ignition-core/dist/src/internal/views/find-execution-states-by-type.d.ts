import type { MapExStateTypeToExState } from "../execution/type-helpers.js";
import type { DeploymentState } from "../execution/types/deployment-state.js";
import type { ExecutionSateType } from "../execution/types/execution-state.js";
export declare function findExecutionStatesByType<ExStateT extends ExecutionSateType>(exStateType: ExStateT, deployment: DeploymentState): Array<MapExStateTypeToExState<ExStateT>>;
//# sourceMappingURL=find-execution-states-by-type.d.ts.map