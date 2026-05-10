import type { MapExStateTypeToExState } from "../execution/type-helpers.js";
import type { DeploymentState } from "../execution/types/deployment-state.js";
import type { ExecutionSateType } from "../execution/types/execution-state.js";
export declare function findExecutionStateById<ExStateT extends ExecutionSateType>(exStateType: ExStateT, deployment: DeploymentState, futureId: string): MapExStateTypeToExState<ExStateT>;
//# sourceMappingURL=find-execution-state-by-id.d.ts.map