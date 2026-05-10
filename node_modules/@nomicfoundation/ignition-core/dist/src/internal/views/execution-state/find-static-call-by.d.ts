import type { CallExecutionState, DeploymentExecutionState, SendDataExecutionState, StaticCallExecutionState } from "../../execution/types/execution-state.js";
import type { StaticCall } from "../../execution/types/network-interaction.js";
export declare function findStaticCallBy(executionState: DeploymentExecutionState | CallExecutionState | StaticCallExecutionState | SendDataExecutionState, networkInteractionId: number): StaticCall;
//# sourceMappingURL=find-static-call-by.d.ts.map